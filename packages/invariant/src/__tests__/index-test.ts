/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import invariant from '..';

describe('invariant()', () => {
  it('complains about null', () => {
    expect(() => invariant(null, 'unexpected null')).toThrow(/unexpected null/);
  });

  it('complains about undefined', () => {
    expect(() => invariant(undefined, 'unexpected undefined')).toThrow(
      /unexpected undefined/,
    );
  });

  it('complains about false', () => {
    expect(() => invariant(false, 'unexpected false')).toThrow(
      /unexpected false/,
    );
  });

  it('complains about 0', () => {
    expect(() => invariant(0, 'unexpected 0')).toThrow(/unexpected 0/);
  });

  it('complains about ""', () => {
    expect(() => invariant('', 'unexpected ""')).toThrow(/unexpected ""/);
  });

  it('uses "failed" as a default format string', () => {
    expect(() => invariant(false)).toThrow('Invariant: failed');
  });

  it('substitutes "%s" markers in the format string', () => {
    expect(() => invariant(false, '%s -> %s', 'a', 'b')).toThrow(
      'Invariant: a -> b',
    );
  });

  it('accepts true', () => {
    expect(() => invariant(true)).not.toThrow();
  });

  it('accepts arrays', () => {
    expect(() => invariant([])).not.toThrow();
  });

  it('accepts non-null objects', () => {
    expect(() => invariant({})).not.toThrow();
  });

  it('accepts non-empty strings', () => {
    expect(() => invariant('foo')).not.toThrow();
  });

  it('accepts non-zero numbers', () => {
    expect(() => invariant(100)).not.toThrow();
  });
});
