/**
 * @flow strict
 */

/**
 * Debounce implementation that fires on the trailing edge only. If a call comes
 * in when a pending call is yet to be finalized, it replaces the pending call.
 */
export default function debounce(
  fn: (...Iterable<mixed>) => mixed,
  interval: number,
) {
  let timeout = null;
  return function() {
    const args = arguments;
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function() {
      fn.apply(context, args);
    }, interval);
  };
}
