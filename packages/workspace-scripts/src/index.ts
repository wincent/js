/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import {existsSync} from 'fs';
import {dirname, join, resolve} from 'path';

import bail from './bail';
import print from './print';

type Subcommand = keyof typeof SUBCOMMANDS;

type Args = {
  subcommands: Subcommand[];
  packages: string[];
  extraArgs: string[];
  root: string;
};

const SUBCOMMANDS = {
  build: async () => (await import('./build')).build,
  'changelogs:check': async () => (await import('./changelogs')).check,
  'format:check': async () => (await import('./format')).formatCheck,
  'lint:fix': async () => (await import('./lint')).lintFix,
  'test:watch': async () => (await import('./test')).testWatch,
  'typecheck:flow': async () => (await import('./typecheck')).typecheckFlow,
  'typecheck:ts': async () => (await import('./typecheck')).typecheckTS,
  format: async () => (await import('./format')).format,
  lint: async () => (await import('./lint')).lint,
  prepublish: async () => (await import('./prepublish')).prepublish,
  test: async () => (await import('./test')).test,
  typecheck: async () => (await import('./typecheck')).typecheck,
};

function usage() {
  print.line(
    'Usage: workspace-scripts SUBCOMMAND... [PACKAGE...] [[--] ARG...]',
  );
  Object.keys(SUBCOMMANDS)
    .sort()
    .forEach(subcommand => {
      print.line(`       workspace-scripts ${subcommand}`);
    });
}

function detectWorkspace(directory: string): boolean {
  const jsonPath = join(directory, 'package.json');
  if (existsSync(jsonPath)) {
    let config;
    try {
      config = require(jsonPath);
    } catch (error) {
      bail(`Error requiring ${jsonPath}: ${error}`);
    }

    let workspaces;
    try {
      workspaces = config.workspaces;
    } catch (error) {
      bail(`Error processing ${jsonPath}: ${error}`);
    }

    if (Array.isArray(workspaces)) {
      return true;
    }
  }
  return false;
}

function getWorkspaceRoot(): string {
  let wd = resolve(process.cwd());
  while (wd !== '/') {
    if (detectWorkspace(wd)) {
      return wd;
    }
    wd = dirname(wd);
  }
  return bail('Failed to find workspace root');
}

function isSubcommand(
  subcommand: string | undefined,
): subcommand is Subcommand {
  return !!subcommand && SUBCOMMANDS.hasOwnProperty(subcommand);
}

function validatePackages(packages: string[], root: string): void {
  const badPackages = packages.filter(pkg => {
    return !existsSync(join(root, 'packages', pkg));
  });

  if (badPackages.length) {
    badPackages.forEach(pkg => print.line.red(`Package ${pkg} does not exist`));
    bail();
  }
}

function parseArgs(args: string[]): Args {
  const root = getWorkspaceRoot();
  const [_node, _binary, ...rest] = args;
  const subcommands: Subcommand[] = [];
  while (rest.length) {
    const subcommand = rest[0];
    if (isSubcommand(subcommand)) {
      subcommands.push(subcommand);
      rest.shift();
    } else {
      break;
    }
  }
  if (!subcommands.length) {
    usage();
    bail();
  }

  const packages = [];
  while (rest.length) {
    const arg = rest[0];
    if (arg === '--') {
      rest.shift();
      break;
    } else if (arg.startsWith('-')) {
      break;
    }

    packages.push(rest.shift() as string);
  }
  validatePackages(packages, root);

  return {
    subcommands,
    packages,
    extraArgs: rest,
    root,
  };
}

export async function main() {
  const {subcommands, packages, extraArgs, root} = parseArgs(process.argv);
  process.chdir(root);
  for (let subcommand of subcommands) {
    const fn = await SUBCOMMANDS[subcommand]();
    await fn(packages, extraArgs);
  }
}
