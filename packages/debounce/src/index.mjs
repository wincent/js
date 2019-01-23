/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @flow strict
 * @license MIT
 */

/**
 * Debounce implementation that fires on the trailing edge only. If a call comes
 * in when a pending call is yet to be finalized, it replaces the pending call.
 */
export default function debounce<T: Iterable<mixed>>(
  fn: (...T) => void,
  interval: number,
): (...T) => void {
  let timeout = null;
  return function(...args: T): void {
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function() {
      fn.apply(context, args);
    }, interval);
  };
}
