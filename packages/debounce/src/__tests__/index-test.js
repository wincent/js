/**
 * @flow strict
 */

import debounce from '..';

describe.skip('debounce()', function() {
  /*
  var clock;
  var spy;

  beforeEach(function () {
    clock = sinon.useFakeTimers();
    spy = sinon.spy();
  });

  afterEach(function () {
    clock.restore();
  });

  it('does nothing when the debounced function is not called', function () {
    debounce(spy, 100);
    clock.tick(1000);
    expect(spy.called).toBe(false);
  });

  it('calls the debounced function after an interval', function () {
    var debounced = debounce(spy, 100);
    debounced();
    clock.tick(50);
    expect(spy.called).toBe(false);
    clock.tick(50);
    expect(spy.called).toBe(true);
  });

  it('uses the last-passed arguments when debouncing multiple calls', function () {
    var debounced = debounce(spy, 100);
    debounced(1);
    debounced(2);
    clock.tick(50);
    expect(spy.called).toBe(false);
    clock.tick(50);
    expect(spy.args.length).toBe(1);
    expect(spy.args[0][0]).toBe(2);
  });

  it('uses the last-employed context when debouncing multiple calls', function () {
    var context;
    var debounced = debounce(function() {
      context = this;
    }, 100);
    var context1 = {};
    var context2 = {};
    debounced.call(context1);
    debounced.call(context2);
    clock.tick(1000);
    expect(context).toBe(context2);
  });
  */
});
