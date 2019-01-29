/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import isObject from '..';

describe('isObject()', () => {
  it('accepts an object', () => {
    expect(isObject({})).toBe(true);
  });

  it('rejects an array', () => {
    expect(isObject([])).toBe(false);
  });

  it('rejects a Date', () => {
    expect(isObject(new Date())).toBe(false);
  });

  it('rejects a string', () => {
    expect(isObject('')).toBe(false);
  });

  it('rejects a number', () => {
    expect(isObject(1)).toBe(false);
  });

  it('rejects null', () => {
    expect(isObject(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isObject(undefined)).toBe(false);
  });

  it('rejects a function', () => {
    expect(isObject(() => {})).toBe(false);
  });
});
