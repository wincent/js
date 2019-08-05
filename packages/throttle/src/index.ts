/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * Throttle implementation that fires on the leading and trailing edges.
 * If multiple calls come in during the throttle interval, the last call's
 * arguments and context are used, replacing those of any previously pending
 * calls.
 */
export default function throttle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  interval: number,
): (...args: TArgs) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let last: number;

  return function(this: any, ...args: TArgs): void {
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
