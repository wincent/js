/**
 * @flow strict
 */

import debounce from '..';

jest.useFakeTimers();

describe('debounce()', () => {
  let spy;

  beforeEach(() => {
    spy = jest.fn();
  });

  it('does nothing when the debounced function is not called', () => {
    debounce(spy, 100);
    jest.advanceTimersByTime(1000);
    expect(spy).not.toBeCalled();
  });

  it('calls the debounced function after an interval', () => {
    const debounced = debounce(spy, 100);
    debounced();
    jest.advanceTimersByTime(50);
    expect(spy).not.toBeCalled();
    jest.advanceTimersByTime(50);
    expect(spy.mock.calls).toEqual([[]]);
  });

  it('uses the last-passed arguments when debouncing multiple calls', () => {
    const debounced = debounce<[number]>(spy, 100);
    debounced(1);
    debounced(2);
    jest.advanceTimersByTime(50);
    expect(spy).not.toBeCalled();
    jest.advanceTimersByTime(50);
    expect(spy.mock.calls).toEqual([[2]]);
  });

  it('uses the last-employed context when debouncing multiple calls', () => {
    let context;
    const debounced = debounce(function() {
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
