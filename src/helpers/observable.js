/**
 * Callback for an observable.
 *
 * @callback observableCallback
 * @template T
 * @param {T} value - The value emitted by the observable.
 */

/**
 * @typedef {Object} Options
 * @property {boolean} [pushLatestValue] - Whether to push the latest value to the subscriber
 * immediately.
 * @property {AbortSignal} [signal] - An abort controller signal to unsubscribe.
 */

/**
 * Represents an observable object that allows other
 * objects to subscribe and receive updates when new
 * values are emitted.
 * @template T
 * @param {T} value
 * @type {Observable<T>}
 */
export class Observable {
  /**
   * @description An array used to store observers.
   * @type {Array<observableCallback>}
   */
  #observers = [];

  /**
   * @type {T} latest event
   */
  #latestValue

  /**
   * Subscribe to an event.
   *
   * @param {observableCallback} callback - The function to be called when the event is triggered.
   *  @param {Options} [options] - Additional options for the subscription.
   */
  subscribe(callback, options) {
    this.#observers.push(callback);

    if (options?.pushLatestValue) {
      callback(this.#latestValue);
    }

    if (options?.signal) {
      options.signal.addEventListener('abort', () => this.unsubscribe(callback));
    }
  }

  unsubscribe(callback) {
    this.#observers = this.#observers.filter(observer => observer !== callback);
  }

  next(value) {
    this.#latestValue = value;
    this.#observers.forEach((observer) => observer(value));
  }
}
