/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import invariant from '@wincent/invariant';

export default function delay(ms: number): Promise<void> {
  invariant(ms >= 0, 'delay() requires non-negative `ms`');
  return new Promise(resolve => setTimeout(resolve, ms));
}
