/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

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

export default print;
