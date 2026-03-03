/**
 * ReactiveStore — Proxy-based state management with batched rendering
 * Source: STACK.md ReactiveStore class (lines 393-528)
 *
 * Features:
 * - Deep reactivity: nested mutations trigger updates
 * - Batched rendering: ticking flag pattern via requestAnimationFrame
 * - Subscription system: watch specific state paths
 * - Debug: inspect state + subscribers via store.debug()
 */
export class ReactiveStore {
  constructor(initialState = {}) {
    this._state = initialState;
    this._subscribers = {}; // { path: [callback, ...] }
    this._pendingRender = false;
    this._renderFn = null;
    this.state = this._createProxy(this._state, '');
  }

  _createProxy(target, path) {
    return new Proxy(target, {
      set: (obj, prop, value) => {
        const fullPath = path ? `${path}.${prop}` : String(prop);

        if (obj[prop] === value) return true; // Skip if unchanged

        obj[prop] = value;
        this._scheduleRender(); // Ticking flag: batch updates
        this._notifySubscribers(fullPath, value);

        return true;
      },

      get: (obj, prop) => {
        const value = obj[prop];
        if (value !== null && typeof value === 'object') {
          const childPath = path ? `${path}.${prop}` : String(prop);
          return this._createProxy(value, childPath);
        }
        return value;
      },
    });
  }

  subscribe(path, callback) {
    if (!this._subscribers[path]) this._subscribers[path] = [];
    this._subscribers[path].push(callback);

    // Return unsubscribe function
    return () => {
      this._subscribers[path] = this._subscribers[path].filter((cb) => cb !== callback);
    };
  }

  setRenderFunction(fn) {
    this._renderFn = fn;
  }

  _scheduleRender() {
    if (this._pendingRender) return; // Flag prevents multiple rAF calls

    this._pendingRender = true;
    requestAnimationFrame(() => {
      if (this._renderFn) this._renderFn();
      this._pendingRender = false;
    });
  }

  _notifySubscribers(path, value) {
    if (this._subscribers[path]) {
      this._subscribers[path].forEach((cb) => {
        cb(value);
      });
    }

    // Notify parent paths
    const parts = path.split('.');
    while (parts.length > 1) {
      parts.pop();
      const parentPath = parts.join('.');
      if (this._subscribers[parentPath]) {
        this._subscribers[parentPath].forEach((cb) => {
          cb(this._getValueAt(parentPath));
        });
      }
    }
  }

  _getValueAt(path) {
    const parts = path.split('.');
    let value = this._state;
    for (const part of parts) {
      value = value[part];
    }
    return value;
  }
}
