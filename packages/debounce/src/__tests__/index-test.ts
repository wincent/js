/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import debounce from '..';

describe('debounce()', () => {
  let fn: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    fn = jest.fn();
  });

  it('does nothing when the debounced function is not called', () => {
    debounce(fn, 100);
    jest.advanceTimersByTime(1000);
    expect(fn).not.toBeCalled();
  });

  it('calls the debounced function after an interval', () => {
    const debounced = debounce(fn, 100);
    debounced();
    jest.advanceTimersByTime(50);
    expect(fn).not.toBeCalled();
    jest.advanceTimersByTime(50);
    expect(fn.mock.calls).toEqual([[]]);
  });

  it('uses the last-passed arguments when debouncing multiple calls', () => {
    const debounced = debounce<[number]>(fn, 100);
    debounced(1);
    debounced(2);
    jest.advanceTimersByTime(50);
    expect(fn).not.toBeCalled();
    jest.advanceTimersByTime(50);
    expect(fn.mock.calls).toEqual([[2]]);
  });

  it('uses the last-employed context when debouncing multiple calls', () => {
    let context;
    const debounced = debounce(function(this: {}) {
      context = this;
    }, 100);
    const context1 = {};
    const context2 = {};
    debounced.call(context1);
    debounced.call(context2);
    jest.advanceTimersByTime(1000);
    expect(context).toBe(context2);
  });
});
