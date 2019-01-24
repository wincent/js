/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * Debounce implementation that fires on the trailing edge only. If a call comes
 * in when a pending call is yet to be finalized, it replaces the pending call.
 */
export default function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  interval: number,
): (...args: T) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: T): void {
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function() {
      fn.apply(context, args);
    }, interval);
  };
}
