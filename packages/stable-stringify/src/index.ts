/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import isObject from '@wincent/is-object';

/**
 * JSON.stringify output is dependent on insertion order, so we use this function
 * to ensure consistent output irrespective of insertion order.
 */
export default function stableStringify(input: unknown): string | void {
  const seen = new Set();

  function stringify(mixed: unknown): string | void {
    if (seen.has(mixed)) {
      throw new TypeError('Converting circular structure to JSON');
    }
    if (Array.isArray(mixed)) {
      seen.add(mixed);
      const output = [];
      for (let i = 0; i < mixed.length; i++) {
        output.push(stableStringify(mixed[i] === undefined ? null : mixed[i]));
      }
      return '[' + output.join(',') + ']';
    } else if (isObject(mixed)) {
      seen.add(mixed);
      return (
        '{' +
        Object.entries(mixed)
          .sort(([aKey, _aValue], [bKey, _bValue]) => {
            return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
          })
          .filter(([_key, value]) => value !== undefined)
          .map(([key, value]) => {
            // We know value !== undefined here, so stringify will
            // return a string.
            const suffix = stringify(value) as string;
            return JSON.stringify(key) + ':' + suffix;
          })
          .join(',') +
        '}'
      );
    } else if (mixed === undefined) {
      return;
    } else {
      // string (or String), integer, Date etc.
      return JSON.stringify(mixed);
    }
  }

  return stringify(input);
}
