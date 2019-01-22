#!/usr/bin/env node

/**
 * Checks built packages prior to publishing to make sure their dependencies are
 * declared in their package.json files.
 */

const fs = require('fs');
const {basename, extname, join, resolve} = require('path');
const {promisify} = require('util');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);

const log = process.stdout.write.bind(process.stdout);

async function forEachPackage(callback) {
  const packages = await readdirAsync('packages', {withFileTypes: true});
  for (const pkg of packages) {
    if (pkg.isDirectory()) {
      await callback(pkg);
    }
  }
}

async function* walk(directory, predicate = () => true) {
  const entries = await readdirAsync(directory, {withFileTypes: true});
  for (const entry of entries) {
    if (entry.isDirectory()) {
      for await (const nested of walk(
        join(directory, entry.name.toString()),
        predicate,
      )) {
        yield nested;
      }
    } else if (predicate(entry)) {
      yield join(directory, entry.name.toString());
    }
  }
}

function isJS(entry) {
  return extname(entry.name.toString()) === '.js';
}

async function forEachJSFile(pkg, callback) {
  const directory = join('packages', pkg.name.toString(), 'lib');
  for await (const file of walk(directory, isJS)) {
    await callback(file);
  }
}

function getPackageConfig(name) {
  return require(resolve(join('packages', name, 'package.json')));
}

/**
 * Extracts a dependency name from a require target such as:
 *
 *   @babel/runtime-corejs2/core-js/set
 *   ^^^^^^^^^^^^^^^^^^^^^^
 *
 * or:
 *
 *   react-dom/server
 *   ^^^^^^^^^
 *
 * but not:
 *
 *   ./foo
 *
 * or:
 *
 *   ../bar
 *
 */
function extractDependencyName(moduleName) {
  const match = moduleName.match(/^(@[^/]+\/[^/]+|[^.][^/]*)/);
  return match ? match[0] : null;
}

async function main() {
  log('Scanning for undeclared package dependencies:\n\n');
  const missing = {};

  await forEachPackage(async pkg => {
    const name = pkg.name.toString();
    const config = getPackageConfig(name);
    const modules = new Set();
    const recordDependency = moduleName => {
      const dependency = extractDependencyName(moduleName);
      if (dependency) {
        modules.add(dependency);
      }
    };

    log(basename(`  ${name}: `));

    await forEachJSFile(pkg, async js => {
      const contents = await readFileAsync(js);
      const ast = parser.parse(contents.toString(), {
        sourceType: 'unambiguous',
        plugins: ['flow'],
      });
      traverse(ast, {
        ImportDeclaration(path) {
          // `importKind` may be "value" or "type".
          if (path.get('importKind').node === 'value') {
            const source = path.get('source');
            if (source.isStringLiteral()) {
              recordDependency(source.node.value);
            }
          }
        },
        CallExpression(path) {
          const callee = path.get('callee');
          if (callee.isIdentifier({name: 'require'})) {
            const args = path.get('arguments');
            if (args.length && args[0].isStringLiteral()) {
              recordDependency(args[0].node.value);
            }
          }
        },
      });
    });

    const dependencies = new Set([
      ...Object.keys(config.dependencies || {}),
      ...Object.keys(config.peerDependencies || {}),
    ]);
    for (const moduleName of modules) {
      if (!dependencies.has(moduleName)) {
        if (!missing[name]) {
          missing[name] = [];
        }
        missing[name].push(moduleName);
      }
    }

    if (missing[name] && missing[name].length) {
      log('MISSING\n');
      missing[name].forEach(dependency => log(`    ${dependency}\n`));
    } else {
      log('OK\n');
    }
  });

  log('\n');
  const exitStatus = Object.keys(missing).length === 0 ? 0 : 1;
  if (exitStatus) {
    log('Add missing dependencies with:\n\n');
    Object.entries(missing).forEach(([name, dependencies]) => {
      log(`(cd packages/${name} && yarn add ${dependencies.join(' ')})\n`);
    });
    log('\n');
  }
  process.exit(exitStatus);
}

main();
