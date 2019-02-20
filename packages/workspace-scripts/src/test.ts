/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import run from './run';

function getTestPathPattern(packages: string[]): string[] {
  if (packages.length) {
    return ['--testPathPattern', `packages/(${packages.join('|')})`];
  } else {
    return [];
  }
}

export function test(packages: string[], extraArgs: string[]) {
  return run(
    'env',
    'BABEL_ENV=jest',
    'jest',
    ...getTestPathPattern(packages),
    ...extraArgs,
  );
}

export function testWatch(packages: string[], extraArgs: string[]) {
  return run(
    'env',
    'BABEL_ENV=jest',
    'jest',
    '--watch',
    ...getTestPathPattern(packages),
    ...extraArgs,
  );
}
