/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import {build} from './build';
import {formatCheck} from './format';
import {lint} from './lint';
import run from './run';
import {test} from './test';
import {typecheck} from './typecheck';

export async function prepublish(packages: string[], extraArgs: string[]) {
  await formatCheck(packages, extraArgs);
  await lint(packages, extraArgs);
  await typecheck(packages, extraArgs);
  await test(packages, extraArgs);
  await build(packages, extraArgs);

  await run('scripts/check-dependencies.js');
  await run('scripts/check-changelogs.js');
  await run('git', 'diff', '--quiet');
}
