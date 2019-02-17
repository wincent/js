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

/**
 * Dependencies that don't need to be explicited recorded because they are
 * implicit. Basically, that means NodeJS built-in modules.
 */
const BUILT_IN_DEPENDENCY_WHITELIST = new Set([
  'child_process',
  'fs',
  'path',
]);

function recordDependency(moduleName, modules) {
  const dependency = extractDependencyName(moduleName);
  if (dependency && !BUILT_IN_DEPENDENCY_WHITELIST.has(dependency)) {
    modules.add(dependency);
  }
}

function getDependencies(config) {
  return [
    ...Object.entries(config.dependencies || {}),
    ...Object.entries(config.devDependencies || {}),
    ...Object.entries(config.peerDependencies || {}),
  ];
}

/**
 * Make sure built code explcitly declares its dependencies.
 */
async function checkForMissingDependencies() {
  print.line('Checking for undeclared package dependencies:\n');
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
      print.line('MISSING');
      missing[name].forEach(dependency => print.line(`    ${dependency}`));
    } else {
      print.line('OK');
    }
  });

  print();
  const success = Object.keys(missing).length === 0;
  if (!success) {
    print.line('Add missing dependencies with:\n');
    Object.entries(missing).forEach(([name, dependencies]) => {
      print.line(`(cd packages/${name} && yarn add ${dependencies.join(' ')})`);
    });
    print();
  }
  return success;
}

/**
 * Make sure packages require identical versions of common dependencies.
 */
async function checkForMismatchedDependencyVersions() {
  print.line('Checking for mismatched dependency versions:\n');
  const registry = {};

  let success = true;
  await forEachPackage((name, config) => {
    const dependencies = getDependencies(config);
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
      print.line('OK');
    } else {
      success = false;
      print.line('BAD');
      for (const [version, dependees] of Object.entries(versions)) {
        for (const dependee of dependees) {
          print.line(`    ${dependee} -> ${version}`);
        }
      }
    }
  }

  print();
  return success;
}

const DEV_DEPENDENCY_WHITELIST = new Set(['@wincent/workspace-scripts']);

/**
 * Make sure devDependencies are only declared at the repository root.
 */
async function checkForDevelopmentDependencies() {
  print.line('Checking for development dependencies in individual packages:\n');
  let success = true;
  await forEachPackage((name, config) => {
    print(`  ${name}: `);
    const devDependencies = Object.keys(config.devDependencies || {}).filter(
      dependency => !DEV_DEPENDENCY_WHITELIST.has(dependency),
    );
    if (devDependencies.length) {
      success = false;
      print.line('BAD');
      devDependencies.forEach(dependency => {
        print.line(`    ${dependency}`);
      });
    } else {
      print.line('OK');
    }
  });

  print();
  if (!success) {
    print.line(
      'These dependencies should be migrated to the root-level package.json',
    );
    print();
  }

  return success;
}

/**
 * Make sure internal dependencies always use the current (latest) versions.
 */
async function checkForNonCurrentInternalDependencies() {
  print.line('Checking for non-current internal dependencies:\n');
  const packages = {};
  await forEachPackage((name, config) => {
    const dependencies = getDependencies(config);
    packages[name] = {
      dependencies,
      version: config.version,
    };
  });

  const internalPackagePrefix = '@wincent/';
  let success = true;

  Object.entries(packages).forEach(([name, {dependencies}]) => {
    print(`  ${name}: `);
    const outdated = [];
    dependencies.forEach(([dependency, version]) => {
      const name = extractDependencyName(dependency);
      if (name) {
        if (name.startsWith(internalPackagePrefix)) {
          const suffix = name.slice(internalPackagePrefix.length);
          if (version !== packages[suffix].version) {
            outdated.push([suffix, version, packages[suffix].version]);
          }
        }
      }
    });
    if (outdated.length) {
      success = false;
      print.line('BAD');
      for (const [dependency, actual, desired] of outdated) {
        print.line(`    ${dependency}: ${actual} != ${desired}`);
      }
    } else {
      print.line('OK');
    }
  });

  print();
  return success;
}

main(async () => {
  let success = await checkForMissingDependencies();
  success &= await checkForMismatchedDependencyVersions();
  success &= await checkForDevelopmentDependencies();
  success &= await checkForNonCurrentInternalDependencies();
  return !!success;
});
