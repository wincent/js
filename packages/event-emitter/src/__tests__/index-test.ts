/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import EventEmitter from '..';

type Calls = Array<unknown[]>;

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('emit', () => {
    it('works with no listeners', () => {
      expect(() => emitter.emit('event')).not.toThrow();
    });

    it('bails on encountering an error in a listener', () => {
      const calls: Calls = [];
      const callback = (...args: unknown[]) => {
        calls.push(args);
        throw new Error('Something went wrong');
      };
      emitter.on('event', callback);
      emitter.on('event', callback);

      expect(() => emitter.emit('event')).toThrow('Something went wrong');
      expect(calls).toEqual([['event']]);
    });
  });

  describe('on()', () => {
    it('accepts a subscriber', () => {
      const calls: Calls = [];
      emitter.on('foo', (...args) => calls.push(args));
      emitter.emit('foo');
      emitter.emit('bar', 10);
      emitter.emit('foo', true, false);
      expect(calls).toEqual([['foo'], ['foo', true, false]]);
    });

    it('calls subscribers in the order that they were registered', () => {
      const calls: Calls = [];
      emitter.on('event', (...args) => calls.push([1, ...args]));
      emitter.on('event', (...args) => calls.push([2, ...args]));
      emitter.on('event', (...args) => calls.push([3, ...args]));
      emitter.emit('event', 'arg');
      expect(calls).toEqual([
        [1, 'event', 'arg'],
        [2, 'event', 'arg'],
        [3, 'event', 'arg'],
      ]);
    });

    it('allows unsubscription with release()', () => {
      const calls: Calls = [];
      const subscription = emitter.on('event', (...args) => calls.push(args));
      emitter.emit('event');
      expect(calls).toEqual([['event']]);

      subscription.release();
      emitter.emit('event');
      expect(calls).toEqual([['event']]);
    });

    it('allows release() to be called multiple times', () => {
      const subscription = emitter.on('event', () => {});
      expect(() => {
        subscription.release();
        subscription.release();
      }).not.toThrow();
    });

    it('allows release() to be called during emission', () => {
      const calls: Calls = [];
      let subscription = emitter.on('event', (...args) => {
        calls.push(args);
        subscription.release();
      });
      expect(() => emitter.emit('event', 1)).not.toThrow();
      expect(calls).toEqual([['event', 1]]);

      emitter.emit('event', 2);
      expect(calls).toEqual([['event', 1]]);
    });

    it('allows the same callback to be (un)subscribed multiple times', () => {
      const calls: Calls = [];
      const callback = (...args: unknown[]) => calls.push(args);
      const subscription = emitter.on('event', callback);
      emitter.on('event', callback);
      emitter.emit('event', 1);
      expect(calls).toEqual([['event', 1], ['event', 1]]);

      subscription.release();
      emitter.emit('event', 2);
      expect(calls).toEqual([['event', 1], ['event', 1], ['event', 2]]);
    });

    it('allows removeAllListeners() to be called during emission', () => {
      const calls: Calls = [];
      const callback = (...args: unknown[]) => {
        calls.push(args);
        emitter.removeAllListeners('event');
      };
      emitter.on('event', callback);
      expect(() => emitter.emit('event')).not.toThrow();
      expect(calls).toEqual([['event']]);

      emitter.on('event', callback);
      expect(calls).toEqual([['event']]);
    });
  });

  describe('once()', () => {
    it('sets up subscribers to be notified exactly once', () => {
      const calls: Calls = [];
      emitter.once('event', (...args) => calls.push(args));
      emitter.emit('event', 1);
      emitter.emit('event', 2);
      expect(calls).toEqual([['event', 1]]);
    });

    it('allows unsubcription', () => {
      const calls: Calls = [];
      const subscription = emitter.once('event', (...args) => calls.push(args));
      subscription.release();
      emitter.emit('event');
      expect(calls).toEqual([]);
    });

    it('allows the same callback to be subscribed multiple times', () => {
      const calls: Calls = [];
      const callback = (...args: unknown[]) => calls.push(args);
      emitter.once('event', callback);
      emitter.once('event', callback);
      emitter.emit('event', 1);
      expect(calls).toEqual([['event', 1], ['event', 1]]);

      emitter.emit('event', 2);
      expect(calls).toEqual([['event', 1], ['event', 1]]);
    });
  });

  describe('removeAllListeners()', () => {
    it('removes all subscribers', () => {
      const calls: Calls = [];
      emitter.on('foo', (...args) => calls.push(args));
      emitter.on('foo', (...args) => calls.push(args));
      emitter.on('bar', (...args) => calls.push(args));

      emitter.removeAllListeners('foo');
      emitter.emit('foo');
      emitter.emit('bar');

      expect(calls).toEqual([['bar']]);
    });

    it('graciously accepts events with no subscribers', () => {
      expect(() => emitter.removeAllListeners('fizzbuzz')).not.toThrow();
    });
  });
});
