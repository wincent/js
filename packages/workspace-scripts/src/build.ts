/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import {join} from 'path';
import run from './run';

export function build(packages: string[], extraArgs: string[]) {
  const packageArgs = packages.length
    ? [`PACKAGES=${packages.map(pkg => join('packages', pkg)).join(' ')}`]
    : [];
  return run('make', '-j', '4', 'all', ...packageArgs, ...extraArgs);
}
