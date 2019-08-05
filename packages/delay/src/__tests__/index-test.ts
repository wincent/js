/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import delay from '..';

describe('delay()', () => {
  it('returns a promise that resolves after a delay', async () => {
    // Hack around current limitations in Jest's fake timers.
    // See: https://stackoverflow.com/a/51132058/2103996
    Promise.resolve().then(() => jest.advanceTimersByTime(5000));
    await delay(4000);
  });
});
