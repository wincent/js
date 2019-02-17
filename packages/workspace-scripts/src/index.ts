/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import {spawn} from 'child_process';
import {existsSync} from 'fs';
import {dirname, join, resolve} from 'path';

type Subcommand = keyof typeof SUBCOMMANDS;

type Args = {
  subcommands: Subcommand[];
  packages: string[];
  extraArgs: string[];
  root: string;
};

const SUBCOMMANDS = {
  build,
  'format:check': formatCheck,
  'lint:fix': lintFix,
  'test:watch': testWatch,
  'typecheck:flow': typecheckFlow,
  'typecheck:ts': typecheckTS,
  format,
  lint,
  test,
  typecheck,
};

const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

const print = Object.assign(
  (output: string) => {
    process.stdout.write(`${output}\n`);
  },
  {
    red(output: string) {
      print(RED + output + RESET);
    },
  },
  {
    yellow(output: string) {
      print(YELLOW + output + RESET);
    },
  },
);

function usage() {
  print('Usage: workspace-scripts SUBCOMMAND... [PACKAGE...] [[--] ARG...]');
  Object.keys(SUBCOMMANDS)
    .sort()
    .forEach(subcommand => {
      print(`       workspace-scripts ${subcommand}`);
    });
}

function bail(message?: string): never {
  if (message) {
    print.red(message);
  }
  return process.exit(1);
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
    badPackages.forEach(pkg => print.red(`Package ${pkg} does not exist`));
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

function getCommandString(command: string, args: string[]): string {
  if (args.length) {
    return `${command} ${args.join(' ')}`;
  } else {
    return command;
  }
}

function run(command: string, ...args: string[]) {
  return new Promise((resolve, _reject) => {
    const child = spawn(command, args, {stdio: 'inherit'});
    child.on('error', error => {
      bail(`Failed to spawn ${getCommandString(command, args)}: ${error}`);
    });

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else if (code !== null) {
        bail(
          `Spawned command ${getCommandString(
            command,
            args,
          )} exited with status ${code}`,
        );
      } else {
        bail(
          `Spawned command ${getCommandString(
            command,
            args,
          )} received signal ${signal}`,
        );
      }
    });
  });
}

function build(packages: string[], extraArgs: string[]) {
  const packageArgs = packages.length
    ? [`PACKAGES=${packages.map(pkg => join('packages', pkg)).join(' ')}`]
    : [];
  return run('make', '-j', '4', 'all', ...packageArgs, ...extraArgs);
}

const FORMAT_ALL_GLOBS = ['.*.{js,json}', '*.{js,json,md}', 'scripts/**/*.js'];

const FORMAT_PACKAGE_GLOBS = [
  'packages/${PACKAGE}/{bin,src}/**/*.{js,js.flow,json,ts}',
  'packages/${PACKAGE}/*.{js,json,md}',
];

function getFormatPackageGlobs(pkgPattern: string): string[] {
  return FORMAT_PACKAGE_GLOBS.map(glob =>
    glob.replace('${PACKAGE}', pkgPattern),
  );
}

function getFormatGlobs(packages: string[]): string[] {
  const globs: string[] = [];
  if (packages.length) {
    packages.forEach(pkg => {
      globs.push(...getFormatPackageGlobs(pkg));
    });
  } else {
    globs.push(...FORMAT_ALL_GLOBS, ...getFormatPackageGlobs('*'));
  }
  return globs;
}

function format(packages: string[], extraArgs: string[]) {
  return run('prettier', '--write', ...extraArgs, ...getFormatGlobs(packages));
}

function formatCheck(packages: string[], extraArgs: string[]) {
  return run(
    'prettier',
    '--list-different',
    ...extraArgs,
    ...getFormatGlobs(packages),
  );
}

const LINT_ALL_GLOB = 'scripts/**/*.js';

const LINT_PACKAGE_GLOB = 'packages/${PACKAGE}/{bin,src}/**/*.{js,ts}';

function getLintPackageGlob(pkgPattern: string): string {
  return LINT_PACKAGE_GLOB.replace('${PACKAGE}', pkgPattern);
}

function getLintGlobs(packages: string[]) {
  const globs: string[] = [];
  if (packages.length) {
    packages.forEach(pkg => {
      globs.push(getLintPackageGlob(pkg));
    });
  } else {
    globs.push(LINT_ALL_GLOB);
  }
  return globs;
}

function lint(packages: string[], extraArgs: string[]) {
  return run('eslint', ...extraArgs, ...getLintGlobs(packages));
}

function lintFix(packages: string[], extraArgs: string[]) {
  return run('eslint', '--fix', ...extraArgs, ...getLintGlobs(packages));
}

function getTestPathPattern(packages: string[]): string[] {
  if (packages.length) {
    return [`--testPathPattern`, `packages/(${packages.join('|')})`];
  } else {
    return [];
  }
}

function test(packages: string[], extraArgs: string[]) {
  return run(
    'env',
    'BABEL_ENV=jest',
    'jest',
    ...getTestPathPattern(packages),
    ...extraArgs,
  );
}

function testWatch(packages: string[], extraArgs: string[]) {
  return run(
    'env',
    'BABEL_ENV=jest',
    'jest',
    '--watch',
    ...getTestPathPattern(packages),
    ...extraArgs,
  );
}

async function typecheck(packages: string[], extraArgs: string[]) {
  await typecheckTS(packages, extraArgs);
  await typecheckFlow(packages, extraArgs);
}

function typecheckFlow(packages: string[], extraArgs: string[]) {
  checkTypecheckPackages(packages);
  return run('flow', ...extraArgs);
}

function typecheckTS(packages: string[], extraArgs: string[]) {
  return run('tsc', ...extraArgs);
}

function checkTypecheckPackages(packages: string[]) {
  const {length} = packages;
  if (length) {
    print.yellow(
      `info: ignoring package argument${length > 1 ? 's' : ''} (${packages.join(
        ', ',
      )}) - typechecking cannot be scoped to individual packages`,
    );
  }
}

export async function main() {
  const {subcommands, packages, extraArgs, root} = parseArgs(process.argv);
  process.chdir(root);
  for (let subcommand of subcommands) {
    await SUBCOMMANDS[subcommand](packages, extraArgs);
  }
}
