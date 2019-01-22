/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @flow strict
 * @license MIT
 */

export default function isObject(mixed: mixed): boolean {
  return (
    mixed !== null &&
    Object.prototype.toString.call(mixed) === '[object Object]'
  );
}
