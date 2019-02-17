/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

let invariant: (
  condition: unknown,
  format?: string,
  ...args: unknown[]
) => void;

if (__DEV__) {
  invariant = function invariant(
    condition: unknown,
    format = 'failed',
    ...args: unknown[]
  ): void {
    if (!condition) {
      const replacements = args.map(String);
      const violation = format.replace(/%s/g, () => replacements.shift() || '');
      throw new Error(`Invariant: ${violation}`);
    }
  };
} else {
  invariant = function invariant(
    condition: unknown,
    _format = 'failed',
    ..._args: unknown[]
  ): void {
    if (!condition) {
      throw new Error('Invariant: failed');
    }
  };
}

export default invariant;
