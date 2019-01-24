/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

export default function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
