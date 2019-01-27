/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

const {join, resolve} = require('path');

function getPackageConfig(name) {
  return require(resolve(join('packages', name, 'package.json')));
}

module.exports = getPackageConfig;
