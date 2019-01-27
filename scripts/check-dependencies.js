#!/usr/bin/env node

/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * Checks built packages prior to publishing to make sure their dependencies are
 * correctly declared in their package.json files.
 */

const fs = require('fs');
const {basename, extname, join} = require('path');
const {promisify} = require('util');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const forEachPackage = require('./lib/forEachPackage');
const main = require('./lib/main');
const print = require('./lib/print');

const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);

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

function isSourceFile(entry) {
  return ['.js', '.mjs'].includes(extname(entry.name.toString()));
}

async function forEachSourceFile(name, callback) {
  const directory = join('packages', name, 'lib');
  for await (const file of walk(directory, isSourceFile)) {
    await callback(file);
  }
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
  print('Checking for undeclared package dependencies:\n\n');
  const missing = {};

  await forEachPackage(async (name, config) => {
    const modules = new Set();

    print(basename(`  ${name}: `));

    await forEachSourceFile(name, async source => {
      const contents = await readFileAsync(source);
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
      print('MISSING\n');
      missing[name].forEach(dependency => print(`    ${dependency}\n`));
    } else {
      print('OK\n');
    }
  });

  print('\n');
  const success = Object.keys(missing).length === 0;
  if (!success) {
    print('Add missing dependencies with:\n\n');
    Object.entries(missing).forEach(([name, dependencies]) => {
      print(`(cd packages/${name} && yarn add ${dependencies.join(' ')})\n`);
    });
    print('\n');
  }
  return success;
}

/**
 * Make sure packages require identical versions of common dependencies.
 */
async function checkDependencyVersions() {
  print('Checking for mismatched dependency versions:\n\n');
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

  for (const [dependency, versions] of Object.entries(registry)) {
    print(`  ${dependency}:  `);
    if (Object.keys(versions).length === 1) {
      print('OK\n');
    } else {
      success = false;
      print('BAD\n');
      for (const [version, dependees] of Object.entries(versions)) {
        for (const dependee of dependees) {
          print(`    ${dependee} -> ${version}\n`);
        }
      }
    }
  }

  print('\n');
  return success;
}

/**
 * Make sure devDependencies are only declared at the repository root.
 */
async function checkDevelopmentDependencies() {
  print('Checking for development dependencies in individual packages:\n\n');
  let success = true;
  await forEachPackage((name, config) => {
    print(`  ${name}: `);
    if (
      config.devDependencies &&
      Object.keys(config.devDependencies).length > 0
    ) {
      success = false;
      print('BAD\n');
      Object.keys(config.devDependencies).forEach(dependency => {
        print(`    ${dependency}\n`);
      });
    } else {
      print('OK\n');
    }
  });

  print('\n');
  if (!success) {
    print('These dependencies should be migrated to the root-level package.json');
    print('\n\n');
  }

  return success;
}

main(async () => {
  let success = await checkMissingDependencies();
  success &= await checkDependencyVersions();
  success &= await checkDevelopmentDependencies();

  return success ? 0 : 1;
});
