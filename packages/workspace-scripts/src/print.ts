/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

const line = Object.assign(
  (output?: string) => {
    if (output != null) {
      print(`${output}\n`);
    } else {
      print();
    }
  },

  {
    green(output?: string) {
      line(GREEN + output + RESET);
    },

    red(output?: string) {
      line(RED + output + RESET);
    },

    yellow(output?: string) {
      line(YELLOW + output + RESET);
    },
  },
);

/**
 * print();
 * print('message');
 * print.red('message');
 * print.yellow('message');
 * print.line('message');
 * print.line.red('message');
 * print.line.yellow('message');
 */
const print = Object.assign(
  (output?: string) => {
    process.stdout.write(output != null ? output : '\n');
  },

  {
    line,

    green(output: string) {
      print(GREEN + output + RESET);
    },

    red(output: string) {
      print(RED + output + RESET);
    },

    yellow(output: string) {
      print(YELLOW + output + RESET);
    },
  },
);

export default print;
