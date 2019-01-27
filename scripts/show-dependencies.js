#!/usr/bin/env node

/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * Prints the dependency graph.
 */

const {basename} = require('path');
const forEachPackage = require('./support/forEachPackage');
const main = require('./support/main');
const print = require('./support/print');

const graph = {};

main(async () => {
  await forEachPackage(async (name, config) => {
    graph[name] = [];
    if (config.dependencies) {
      Object.entries(config.dependencies).forEach(([dependency, version]) => {
        if (dependency.startsWith('@wincent')) {
          const package = basename(dependency);
          print(`${name} depends on ${package} v${version}\n`);
        }
      });
    }
  });
});
