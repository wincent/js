/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

const fs = require('fs');
const {join, resolve} = require('path');
const {promisify} = require('util');

const readdirAsync = promisify(fs.readdir);

function getPackageConfig(name) {
  return require(resolve(join('packages', name, 'package.json')));
}

/**
 * Execute `callback` in the context of each package in the monorepo.
 *
 * `callback` will be invoked with the package name and its config (as read from
 * the "package.json" file).
 */
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

module.exports = forEachPackage;
