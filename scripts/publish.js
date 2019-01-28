#!/usr/bin/env node

/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

const {spawn, spawnSync} = require('child_process');
const {writeFile} = require('fs');
const {basename, join} = require('path');
const readline = require('readline');
const {promisify} = require('util');
const getPackageConfig = require('./lib/getPackageConfig');
const forEachPackage = require('./lib/forEachPackage');
const main = require('./lib/main');
const print = require('./lib/print');

const writeFileAsync = promisify(writeFile);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getPackageNames() {
  const names = [];
  await forEachPackage((_, config) => {
    names.push(config.name);
  });
  return names.sort();
}

function runPrepublishChecks() {
  return new Promise((resolve, reject) => {
    const yarn = spawn('yarn', ['prepublishOnly']);
    let stdout = '';
    yarn.stderr.on('data', () => print('.'));
    yarn.stdout.on('data', data => {
      stdout += data;
      print('.');
    });
    yarn.on('close', code => {
      if (code) {
        print.line(`\n${stdout}`);
        reject(new Error('yarn prepublishOnly failed'));
      } else {
        print();
        resolve();
      }
    });
  });
}

function run(command, ...args) {
  const {status, stderr, stdout} = spawnSync(command, ...args);
  if (status) {
    print.line(stdout);
    print.line(stderr);
    throw new Error(`${command} failed`);
  }
  return stdout.toString().trim();
}

function withTemporaryDirectory(callback) {
  const directory = run('mktemp', ['-d']);
  return callback(directory);
}

function input(prompt, initial = '') {
  const promise = new Promise((resolve, _reject) => {
    rl.question(`${prompt} `, resolve);
  });
  if (initial) {
    rl.write(initial);
  }
  return promise;
}

let otp = '';

main(async () => {
  const [_executable, _script, ...packages] = process.argv;
  if (!packages.length) {
    print.line('Expected at least one package name:');
    const names = await getPackageNames();
    const basenames = names.map(name => basename(name));
    print.line(` ${basenames.join(', ')}`);
    return 1;
  }

  if (!process.env.SKIP_CHECKS) {
    await runPrepublishChecks();
  }

  for (const name of packages) {
    await withTemporaryDirectory(async dirname => {
      print.line(`Copying from ${name} to ${dirname}...`);
      run('cp', ['-R', join('packages', name), dirname]);

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
      const stdout = run(
        'npm',
        ['publish', '--access', 'public', '--otp', otp],
        {
          cwd: join(dirname, name),
        },
      );
      print.line(stdout);
      const tag = `${name}-${config.version}x`;
      const yes = await input(`Create tag ${tag}? [y/n]`, 'y');
      if (yes.match(/^\s*y(es?)?\s*/i)) {
        run('git', ['tag', '-s', '-m', `${name} ${config.version} release`, tag]);
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
      `---------------------------------------------------${hyphens}-\n`,
  );
  rl.close();
});
