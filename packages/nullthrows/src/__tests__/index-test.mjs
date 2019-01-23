/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @flow strict
 * @license MIT
 */

import nullthrows from '..';

describe('nullthrows()', () => {
  it('it throws when passed null', () => {
    expect(() => nullthrows(null)).toThrow(/Unexpected null-ish/);
  });

  it('it throws when passed undefined', () => {
    expect(() => nullthrows(undefined)).toThrow(/Unexpected null-ish/);
  });

  it('it returns the original value', () => {
    const value = {};
    expect(nullthrows(value)).toBe(value);
  });
});
