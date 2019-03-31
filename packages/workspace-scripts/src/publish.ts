/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import {spawn, spawnSync} from 'child_process';
import {writeFile} from 'fs';
import {basename, join} from 'path';
import {createInterface} from 'readline';
import {promisify} from 'util';
import bail from './bail';
import getPackageConfig from './getPackageConfig';
import forEachPackage from './forEachPackage';
import print from './print';

const writeFileAsync = promisify(writeFile);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getPackageNames() {
  const names: string[] = [];
  await forEachPackage((_, config) => {
    names.push(config.name);
  });
  return names.sort();
}

function runPrepublishChecks() {
  return new Promise((resolve, reject) => {
    const yarn = spawn('yarn', ['run', 'prepublish']);
    if (!yarn.stderr || !yarn.stdout) {
      throw new Error('spawn did not provide stderr and stdout');
    }

    let stdout = '';
    let stderr = '';

    yarn.stderr.on('data', data => {
      stderr += data;
      print('.');
    });

    yarn.stdout.on('data', data => {
      stdout += data;
      print('.');
    });

    yarn.on('close', code => {
      if (code) {
        print.line(`\n${stdout}`);
        print.line(`\n${stderr}`);
        reject(new Error('yarn prepublishOnly failed'));
      } else {
        print();
        resolve();
      }
    });
  });
}

function capture(command: string, args: string[], options: object = {}) {
  const {status, stderr, stdout} = spawnSync(command, args, options);
  if (status) {
    print.line(stdout.toString());
    print.line(stderr.toString());
    throw new Error(`${command} failed`);
  }
  return stdout.toString().trim();
}

function withTemporaryDirectory(callback: (dirname: string) => void) {
  const directory = capture('mktemp', ['-d']);
  return callback(directory);
}

function input(prompt: string, initial = ''): Promise<string> {
  const promise: Promise<string> = new Promise((resolve, _reject) => {
    rl.question(`${prompt} `, resolve);
  });
  if (initial) {
    rl.write(initial);
  }
  return promise;
}

let otp = '';

export async function publish(packages: string[], _extraArgs: string[]) {
  if (!packages.length) {
    print.line.red('Expected at least one package name:');
    const names = await getPackageNames();
    const basenames = names.map(name => basename(name));
    print.line(` ${basenames.join(', ')}`);
    bail();
  }

  if (!process.env.SKIP_CHECKS) {
    await runPrepublishChecks();
  }

  for (const name of packages) {
    await withTemporaryDirectory(async dirname => {
      print.line(`Copying from ${name} to ${dirname}...`);
      capture('cp', ['-R', join('packages', name), dirname]);

      print.line('Remove blocking prepublishOnly hook...');
      const config = getPackageConfig(name);
      delete config.scripts.prepublishOnly;
      if (!Object.keys(config.scripts).length) {
        delete config.scripts;
      }
      await writeFileAsync(
        join(dirname, name, 'package.json'),
        JSON.stringify(config, null, 2),
      );

      print.line(`Publising version ${config.version}`);

      otp = await input('Please enter a OTP token:', otp);
      const stdout = capture(
        'yarn',
        ['publish', '--access', 'public', '--otp', otp],
        {
          cwd: join(dirname, name),
        },
      );
      print.line(stdout);
      const tag = `${name}-${config.version}`;
      const yes = await input(`Create tag ${tag}? [y/n]`, 'y');
      if (yes.match(/^\s*y(es?)?\s*/i)) {
        capture('git', [
          'tag',
          '-s',
          '-m',
          `${name} ${config.version} release`,
          tag,
        ]);
      }
    });
  }

  const summary = packages.length === 1 ? 'this one' : 'these';
  const hyphens = '-'.repeat(summary.length);
  print.line(
    '\n' +
      `---------------------------------------------------${hyphens}-\n` +
      `Done. Publishing another package immediately after ${summary}?\n` +
      'Run with `env SKIP_CHECKS=1`.\n' +
      '\n' +
      'If you have finished, run:\n' +
      '\n' +
      '    git push origin --follow-tags\n' +
      '    git push github --follow-tags\n' +
      '\n' +
      'And edit the release notes at:\n' +
      '\n' +
      '    https://github.com/wincent/js/releases\n' +
      '\n' +
      `---------------------------------------------------${hyphens}-\n`,
  );
  rl.close();
}
