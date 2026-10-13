import { useEffect, useRef, useState } from 'react';

export function useFlash<T>(initial: T, defaultDurationMs?: number) {
  const [value, setValue] = useState<T>(initial);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingAutoHide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // A new flash owns the slot: any pending auto-hide from an earlier flash
  // must not clear this one early.
  const flash = (next: T, durationMs = defaultDurationMs) => {
    cancelPendingAutoHide();
    setValue(next);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setValue(initial);
    }, durationMs);
  };

  // Sticky replacement with no auto-hide: for in-progress messages that are
  // cleared by a later action, not by the clock. Cancels any pending
  // auto-hide so an earlier flash can't kill the sticky value mid-flight.
  const set = (next: T) => {
    cancelPendingAutoHide();
    setValue(next);
  };

  // No late setState after unmount: the pending auto-hide dies with the hook.
  useEffect(() => cancelPendingAutoHide, []);

  return [value, { set, flash }] as const;
}
