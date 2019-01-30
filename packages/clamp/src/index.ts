/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

export default function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  if (minimum <= maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  } else {
    return NaN;
  }
}
