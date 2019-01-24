/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

export default function isObject(value: unknown): value is object {
  return (
    value !== null &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}
