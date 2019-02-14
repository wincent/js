/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

type EventEmitterCallback = (event: string, ...rest: unknown[]) => void;
type CallbackMap = Map<number, EventEmitterCallback>;
type EventMap = Map<string, CallbackMap>;

type Subscription = {
  readonly release: () => void;
};

/**
 * Subset of the functionality provided by the Node EventEmitter class.
 */
export default class EventEmitter {
  private _events: EventMap;
  private _nextHandle: number;

  constructor() {
    this._events = new Map();
    this._nextHandle = 0;
  }

  emit(event: string, ...args: unknown[]) {
    const listeners = this._events.get(event);
    if (listeners) {
      const handles = listeners.keys();
      for (const handle of handles) {
        // Check each callback in case it was removed during iteration.
        const callback = listeners.get(handle);
        if (callback) {
          callback(event, ...args);
        }
      }
    }
  }

  on(event: string, callback: EventEmitterCallback): Subscription {
    if (!this._events.has(event)) {
      this._events.set(event, new Map());
    }
    const listeners = this._events.get(event) as CallbackMap;
    const handle = this._nextHandle++;
    listeners.set(handle, callback);
    return {
      release() {
        listeners.delete(handle);
      },
    };
  }

  once(event: string, callback: EventEmitterCallback): Subscription {
    const subscription = this.on(event, (event, ...args) => {
      subscription.release();
      callback(event, ...args);
    });
    return subscription;
  }

  removeAllListeners(event: string) {
    this._events.delete(event);
  }
}
