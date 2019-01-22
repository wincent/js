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
      const name = pkg.name.toString();
      const config = getPackageConfig(name);
      await callback(name, config);
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

async function forEachJSFile(name, callback) {
  const directory = join('packages', name, 'lib');
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

function recordDependency(moduleName, modules) {
  const dependency = extractDependencyName(moduleName);
  if (dependency) {
    modules.add(dependency);
  }
}

/**
 * Make sure built code explcitly declares its dependencies.
 */
async function checkMissingDependencies() {
  log('Checking for undeclared package dependencies:\n\n');
  const missing = {};

  await forEachPackage(async (name, config) => {
    const modules = new Set();

    log(basename(`  ${name}: `));

    await forEachJSFile(name, async js => {
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
              recordDependency(source.node.value, modules);
            }
          }
        },
        CallExpression(path) {
          const callee = path.get('callee');
          if (callee.isIdentifier({name: 'require'})) {
            const args = path.get('arguments');
            if (args.length && args[0].isStringLiteral()) {
              recordDependency(args[0].node.value, modules);
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
  const success = Object.keys(missing).length === 0;
  if (!success) {
    log('Add missing dependencies with:\n\n');
    Object.entries(missing).forEach(([name, dependencies]) => {
      log(`(cd packages/${name} && yarn add ${dependencies.join(' ')})\n`);
    });
    log('\n');
  }
  return success;
}

/**
 * Make sure packages require identical versions of common dependencies.
 */
async function checkDependencyVersions() {
  log('Checking for mismatched dependency versions:\n\n');
  const registry = {};

  let success = true;
  await forEachPackage((name, config) => {
    const dependencies = [
      ...Object.entries(config.dependencies || {}),
      ...Object.entries(config.devDependencies || {}),
      ...Object.entries(config.peerDependencies || {}),
    ];
    dependencies.forEach(([dependency, version]) => {
      if (!registry[dependency]) {
        registry[dependency] = {};
      }
      if (!registry[dependency][version]) {
        registry[dependency][version] = new Set();
      }
      recordDependency(name, registry[dependency][version]);
    });
  });

  for ([dependency, versions] of Object.entries(registry)) {
    log(`  ${dependency}:  `);
    if (Object.keys(versions).length === 1) {
      log('OK\n');
    } else {
      success = false;
      log('BAD\n');
      for ([version, dependees] of Object.entries(versions)) {
        for (const dependee of dependees) {
          log(`    ${dependee} -> ${version}\n`);
        }
      }
    }
  }

  log('\n');
  return success;
}

/**
 * Make sure devDependencies are only declared at the repository root.
 */
async function checkDevelopmentDependencies() {
  log('Checking for development dependencies in individual packages:\n\n');
  let success = true;
  await forEachPackage((name, config) => {
    log(`  ${name}: `);
    if (config.devDependencies && Object.keys(config.devDependencies).length > 0) {
      success = false;
      log('BAD\n');
      Object.keys(config.devDependencies).forEach(dependency => {
        log(`    ${dependency}\n`);
      });
    } else {
      log('OK\n');
    }
  });

  log('\n');
  if (!success) {
    log('These dependencies should be migrated to the root-level package.json');
    log('\n\n');
  }

  return success;
}

async function main() {
  let success = await checkMissingDependencies();
  success &= await checkDependencyVersions();
  success &= await checkDevelopmentDependencies();
  process.exit(success ? 0 : 1);
}

main();
