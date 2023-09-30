import { Observable } from './observable.js';

describe('Observable', () => {
  describe('subscribe', () => {
    it('adds a callback to the observers array', () => {
      const observable = new Observable();
      const callback = vi.fn();
      observable.subscribe(callback);

      observable.next('test');
      expect(callback).toHaveBeenCalledWith('test');
    });

    it('calls the callback with the latest value if pushLatestValue is true', () => {
      const observable = new Observable();
      const callback = vi.fn();
      observable.next('test');
      observable.subscribe(callback, { pushLatestValue: true });

      expect(callback).toHaveBeenCalledWith('test');
    });

    it('does not call the callback with the latest value if pushLatestValue is false', () => {
      const observable = new Observable();
      const callback = vi.fn();
      observable.next('test');
      observable.subscribe(callback, { pushLatestValue: false });

      expect(callback).not.toHaveBeenCalledWith('test');
    });

    it('accepts abort controller signal to unsubscribe', () => {
      const observable = new Observable();
      const callback = vi.fn();
      const controller = new AbortController();
      observable.subscribe(callback, { signal: controller.signal });
      controller.abort();

      observable.next('test');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('removes a callback from the observers array', () => {
      const observable = new Observable();
      const callback = vi.fn();
      observable.subscribe(callback);
      observable.unsubscribe(callback);

      observable.next('test');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('next', () => {
    it('calls all the callbacks with the value', () => {
      const observable = new Observable();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      observable.subscribe(callback1);
      observable.subscribe(callback2);
      observable.next('test');

      expect(callback1).toHaveBeenCalledWith('test');
      expect(callback2).toHaveBeenCalledWith('test');
    });
  });
});
