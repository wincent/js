/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import print from './print';
import run from './run';

let typecheckWarningCount = 0;

/**
 * Warns, at most once per run, about ignored package arguments.
 */
function checkTypecheckPackages(packages: string[]) {
  if (typecheckWarningCount++) {
    return;
  }
  const {length} = packages;
  if (length) {
    print.yellow(
      `info: ignoring package argument${length > 1 ? 's' : ''} (${packages.join(
        ', ',
      )}) - typechecking cannot be scoped to individual packages`,
    );
  }
}

export async function typecheck(packages: string[], extraArgs: string[]) {
  await typecheckTS(packages, extraArgs);
  await typecheckFlow(packages, extraArgs);
}

export function typecheckFlow(packages: string[], extraArgs: string[]) {
  checkTypecheckPackages(packages);
  return run('flow', ...extraArgs);
}

export function typecheckTS(packages: string[], extraArgs: string[]) {
  checkTypecheckPackages(packages);
  return run('tsc', ...extraArgs);
}
