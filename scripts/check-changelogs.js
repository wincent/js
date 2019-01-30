#!/usr/bin/env node

/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * Checks that changelogs are up-to-date.
 */

const fs = require('fs');
const {join} = require('path');
const {promisify} = require('util');
const forEachPackage = require('./lib/forEachPackage');
const main = require('./lib/main');
const print = require('./lib/print');

const readFileAsync = promisify(fs.readFile);

function escapeForRegExp(string) {
  const specialChars = '^$\\.*+?()[]{}|';
  const escapedChars = specialChars.replace(/./g, '\\$&');
  const pattern = new RegExp(`[${escapedChars}]`, 'g');
  return string.replace(pattern, '\\$&');
}

main(async () => {
  let success = true;
  print.line('Checking changelogs are up-to-date:\n');
  await forEachPackage(async (name, config) => {
    print(`  ${name}: `);
    const changelog = (await readFileAsync(
      join('packages', name, 'CHANGELOG.md'),
    )).toString();
    const version = escapeForRegExp(config.version);
    const pattern = `^## ${version} \\(\\d{1,2} \\w+ 20\\d{2}\\)$`;
    if (changelog.match(new RegExp(pattern, 'm'))) {
      print.line('OK');
    } else {
      success = false;
      print.line(
        `BAD [Expected line matching: "## ${
          config.version
        } ($DAY $MONTH $YEAR)"]`,
      );
    }
  });
  print();
  return success;
});
