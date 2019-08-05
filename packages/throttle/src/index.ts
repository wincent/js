/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * Throttle implementation that fires on the leading and trailing edges.
 * If a call comes in when a pending call is yet to be processed, it replaces
 * the pending call.
 */
export default function throttle<TArgs: Iterable<mixed>>(
  fn: (...TArgs) => void,
  interval: number,
): (...TArgs) => void {
  let timeout = null;
  let last = null;
  return function() {
    const args: TArgs = arguments;
    const context = this;
    const now = Date.now();
    if (timeout === null) {
      timeout = setTimeout(() => (timeout = null), interval);
      last = now;
      fn.apply(context, args);
    } else {
      const remaining = Math.max(last + interval - now, 0);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = setTimeout(() => (timeout = null), interval);
        last = now;
        fn.apply(context, args);
      }, remaining);
    }
  };
}
