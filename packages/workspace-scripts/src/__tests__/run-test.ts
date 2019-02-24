/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import run from '../run';

describe('run()', () => {
  it('runs a command', async () => {
    await run('true');
  });
});
