/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @flow strict
 * @license MIT
 */

export default function nullthrows<T: mixed>(object: T): $NonMaybeType<T> {
  if (object == null) {
    throw new Error('Unexpected null-ish object');
  }
  return object;
}
