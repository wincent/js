/**
 * @flow strict
 */

export default function isObject(mixed: mixed): boolean {
  return (
    mixed !== null &&
    Object.prototype.toString.call(mixed) === '[object Object]'
  );
}
