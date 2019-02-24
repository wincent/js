/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import print from './print';

export default function bail(message?: string): never {
  if (message) {
    print.line.red(message);
  }
  return process.exit(1);
}
