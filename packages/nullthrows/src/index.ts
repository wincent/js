/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @flow strict
 * @license MIT
 */

export default function nullthrows<T>(value: T): NonNullable<T> {
  if (value == null) {
    throw new Error('Unexpected null-ish value');
  }
  return value as NonNullable<T>;
}
