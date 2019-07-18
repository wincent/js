/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * Checks that changelogs are up-to-date.
 */

import {readFile} from 'fs';
import {join} from 'path';
import {promisify} from 'util';
import bail from './bail';
import forEachPackage from './forEachPackage';
import print from './print';

const readFileAsync = promisify(readFile);

function escapeForRegExp(string: string) {
  const specialChars = '^$\\.*+?()[]{}|';
  const escapedChars = specialChars.replace(/./g, '\\$&');
  const pattern = new RegExp(`[${escapedChars}]`, 'g');
  return string.replace(pattern, '\\$&');
}

export async function checkChangelogs(
  packages: string[],
  _extraArgs: string[],
) {
  let success = true;
  const packageSet = new Set(packages);
  print.line.yellow('Checking changelogs are up-to-date:');
  await forEachPackage(async (name, config) => {
    if (!packageSet.size || packageSet.has(name)) {
      print(`  ${name}: `);
      const changelog = (await readFileAsync(
        join('packages', name, 'CHANGELOG.md'),
      )).toString();
      const version = escapeForRegExp(config.version);
      const pattern = `^## ${version} \\(\\d{1,2} \\w+ 20\\d{2}\\)$`;
      if (changelog.match(new RegExp(pattern, 'm'))) {
        print.line.green('OK');
      } else {
        success = false;
        print.line.red(
          `BAD [Expected line matching: "## ${config.version} ($DAY $MONTH $YEAR)"]`,
        );
      }
    }
  });
  print();

  if (!success) {
    bail();
  }
}
