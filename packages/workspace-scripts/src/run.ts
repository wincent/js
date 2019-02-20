/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import {spawn} from 'child_process';
import bail from './bail';

function getCommandString(command: string, args: string[]): string {
  if (args.length) {
    return `${command} ${args.join(' ')}`;
  } else {
    return command;
  }
}

export default function run(command: string, ...args: string[]) {
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
