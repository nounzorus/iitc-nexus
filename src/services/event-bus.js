/**
 * EventBus — Lightweight pub/sub for inter-component communication
 * Source: STACK.md EventBus class (lines 211-278)
 *
 * Emits named events with payloads. Components subscribe/unsubscribe.
 * No external dependencies. Works in IITC plugin userscript context.
 */
export class EventBus {
  constructor() {
    this._listeners = {};
  }

  on(eventName, handler) {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].push({ fn: handler, once: false });
    return () => this.off(eventName, handler); // Unsubscribe function
  }

  once(eventName, handler) {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].push({ fn: handler, once: true });
  }

  off(eventName, handler) {
    if (!this._listeners[eventName]) return;
    this._listeners[eventName] = this._listeners[eventName].filter((listener) => listener.fn !== handler);
  }

  emit(eventName, data) {
    if (!this._listeners[eventName]) return;
    const toRemove = [];
    this._listeners[eventName].forEach((listener, idx) => {
      listener.fn(data);

      if (listener.once) toRemove.push(idx);
    });
    toRemove.reverse().forEach((idx) => {
      this._listeners[eventName].splice(idx, 1);
    });
  }

  clear(eventName) {
    if (eventName) delete this._listeners[eventName];
    else this._listeners = {};
  }
}
