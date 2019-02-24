/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * Checks built packages prior to publishing to make sure their dependencies are
 * correctly declared in their package.json files.
 */

import {Dirent, readdir, readFile} from 'fs';
import {basename, extname, join} from 'path';
import {promisify} from 'util';
import {parse} from '@babel/parser';
import {default as traverse, NodePath} from '@babel/traverse';
import bail from './bail';
import forEachPackage from './forEachPackage';
import {Config} from './getPackageConfig';
import print from './print';

import {types} from 'babel__core';

type CallExpression = types.CallExpression;
type ImportDeclaration = types.ImportDeclaration;

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

/**
 * This used to be an async generator that worked fine in NodeJS (tested in
 * v11.6.0, for example), but when transpiled in Babel with
 * @babel/plugin-proposal-async-generator-functions it's broken; see:
 *
 * - https://github.com/babel/babel/issues/7467
 * - https://github.com/babel/babel/issues/8450
 *
 * So now it is written using callbacks instead of `yield`.
 */
async function walk(
  directory: string,
  predicate: (entry: Dirent) => boolean,
  callback: (entry: string) => void,
) {
  const entries = await readdirAsync(directory, {withFileTypes: true});
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await walk(join(directory, entry.name.toString()), predicate, callback);
    } else if (predicate(entry)) {
      await callback(join(directory, entry.name.toString()));
    }
  }
}

function isSourceFile(entry: Dirent) {
  return ['.js', '.mjs'].includes(extname(entry.name.toString()));
}

type Callback = (string: string) => void;

async function forEachSourceFile(name: string, callback: Callback) {
  const directory = join('packages', name, 'lib');
  await walk(directory, isSourceFile, callback);
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
function extractDependencyName(moduleName: string) {
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
  'util',
]);

function recordDependency(moduleName: string, modules: Set<string>) {
  const dependency = extractDependencyName(moduleName);
  if (dependency && !BUILT_IN_DEPENDENCY_WHITELIST.has(dependency)) {
    modules.add(dependency);
  }
}

function getDependencies(config: Config): Array<[string, string]> {
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
  print.line.yellow('Checking for undeclared package dependencies:\n');
  const missing: {[name: string]: string[]} = {};

  await forEachPackage(async (name, config) => {
    const modules = new Set();

    print(basename(`  ${name}: `));

    await forEachSourceFile(name, async (source: string) => {
      const contents = await readFileAsync(source);
      const ast = parse(contents.toString(), {
        sourceType: 'unambiguous',
        plugins: ['flow'],
      });
      traverse(ast, {
        ImportDeclaration(path: NodePath<ImportDeclaration>) {
          const source = path.get('source');
          if (source.isStringLiteral()) {
            recordDependency(source.node.value, modules);
          }
        },
        CallExpression(path: NodePath<CallExpression>) {
          const callee = path.get('callee');
          if (callee.isIdentifier({name: 'require'})) {
            const args = path.get('arguments');
            if (args.length) {
              const firstArg = args[0];
              if (firstArg.isStringLiteral()) {
                recordDependency(firstArg.node.value, modules);
              }
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
      print.line.red('MISSING');
      missing[name].forEach(dependency => print.line(`    ${dependency}`));
    } else {
      print.line.green('OK');
    }
  });

  print();
  const success = Object.keys(missing).length === 0;
  if (!success) {
    print.line.red('Add missing dependencies with:\n');
    Object.entries(missing).forEach(([name, dependencies]) => {
      print.line.red(
        `(cd packages/${name} && yarn add ${dependencies.join(' ')})`,
      );
    });
    print();
  }
  return success;
}

/**
 * Make sure packages require identical versions of common dependencies.
 */
async function checkForMismatchedDependencyVersions() {
  print.line.yellow('Checking for mismatched dependency versions:\n');
  const registry: {[name: string]: {[version: string]: Set<string>}} = {};

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
      print.line.green('OK');
    } else {
      success = false;
      print.line.red('BAD');
      for (const [version, dependees] of Object.entries(versions)) {
        for (const dependee of dependees) {
          print.line.red(`    ${dependee} -> ${version}`);
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
  print.line.yellow(
    'Checking for development dependencies in individual packages:\n',
  );
  let success = true;
  await forEachPackage((name, config) => {
    print(`  ${name}: `);
    const devDependencies = Object.keys(config.devDependencies || {}).filter(
      dependency => !DEV_DEPENDENCY_WHITELIST.has(dependency),
    );
    if (devDependencies.length) {
      success = false;
      print.line.red('BAD');
      devDependencies.forEach(dependency => {
        print.line.red(`    ${dependency}`);
      });
    } else {
      print.line.green('OK');
    }
  });

  print();
  if (!success) {
    print.line.red(
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
  print.line.yellow('Checking for non-current internal dependencies:\n');
  const packages: {
    [name: string]: {dependencies: Array<[string, string]>; version: string};
  } = {};
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
    const outdated: Array<[string, string, string]> = [];
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
      print.line.red('BAD');
      for (const [dependency, actual, desired] of outdated) {
        print.line.red(`    ${dependency}: ${actual} != ${desired}`);
      }
    } else {
      print.line.green('OK');
    }
  });

  print();
  return success;
}

export async function check(packages: string[], extraArgs: string[]) {
  // TODO: deal with args, maybe...
  let success = await checkForMissingDependencies();
  success = (await checkForMismatchedDependencyVersions()) && success;
  success = (await checkForDevelopmentDependencies()) && success;
  success = (await checkForNonCurrentInternalDependencies()) && success;

  if (!success) {
    bail();
  }
}
