/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

const print = require('./print');

process.on('unhandledRejection', error => {
  print.line(`\nerror: ${error.message}`);
  process.exit(1);
});

async function main(callback) {
  const status = await callback();
  process.exit(+status);
}

module.exports = main;
