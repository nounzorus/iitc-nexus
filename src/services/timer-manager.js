/**
 * TimerManager — Centralized setInterval/setTimeout tracking
 * Source: PITFALLS.md Pitfall 3 TimerManager implementation (lines 209-245)
 *
 * Usage:
 *   const id = timerManager.setInterval(fn, 1000, 'my-component');
 *   // Later, in destroy():
 *   timerManager.clearAll('my-component');
 */
export class TimerManager {
  constructor() {
    this.timers = new Map(); // Map<id, {id, type, componentId, created}>
    this.nextId = 1;
  }

  setInterval(fn, delay, componentId = 'unknown') {
    const id = setInterval(fn, delay);
    this.timers.set(id, {
      id,
      type: 'interval',
      componentId,
      created: new Date(),
    });
    return id;
  }

  setTimeout(fn, delay, componentId = 'unknown') {
    const id = setTimeout(fn, delay);
    this.timers.set(id, {
      id,
      type: 'timeout',
      componentId,
      created: new Date(),
    });
    return id;
  }

  clear(id) {
    const timer = this.timers.get(id);
    if (!timer) return;

    if (timer.type === 'interval') clearInterval(id);
    else clearTimeout(id);

    this.timers.delete(id);
  }

  clearAll(componentId) {
    const toRemove = [];
    for (const [id, timer] of this.timers) {
      if (timer.componentId === componentId) {
        if (timer.type === 'interval') clearInterval(id);
        else clearTimeout(id);
        toRemove.push(id);
      }
    }
    toRemove.forEach((id) => this.timers.delete(id));
  }

  clearAllGlobal() {
    for (const [id, timer] of this.timers) {
      if (timer.type === 'interval') clearInterval(id);
      else clearTimeout(id);
    }
    this.timers.clear();
  }

  _groupByComponent() {
    const groups = {};
    for (const timer of this.timers.values()) {
      if (!groups[timer.componentId]) groups[timer.componentId] = 0;
      groups[timer.componentId]++;
    }
    return groups;
  }
}

export const timerManager = new TimerManager();
