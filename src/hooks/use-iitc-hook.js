import { useState, useEffect } from 'preact/hooks';

/**
 * Subscribe to an IITC signal with auto-cleanup on component unmount.
 * In JSX, prefer reading signal.value directly — Preact handles cleanup automatically.
 * Use this hook for signal access in useEffect or event handler logic outside JSX.
 *
 * @param {import('@preact/signals').Signal} signal - Signal to subscribe to
 * @returns {*} Current signal value; triggers re-render when signal changes
 */
export function useIITCHook(signal) {
  const [value, setValue] = useState(signal.value);

  useEffect(() => {
    // Sync initial value (may have changed between render and effect)
    setValue(signal.value);
    // signal.subscribe() returns unsubscribe fn — return it for cleanup
    return signal.subscribe((newValue) => setValue(newValue));
  }, [signal]);

  return value;
}
