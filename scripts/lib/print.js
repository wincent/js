/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

function print(message) {
  process.stdout.write(message != null ? message : '\n');
}

print.line = message => (message != null ? print(`${message}\n`) : print());

module.exports = print;
