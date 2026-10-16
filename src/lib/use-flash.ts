import { useEffect, useRef, useState } from 'react'

/**
 * Transient button feedback that auto-hides after its duration (the copy
 * action's "Copied!" flag). Toast-style messaging belongs to Sonner; this
 * hook is only for state that lives on a button, not in a live region.
 */
export function useFlash<T>(initial: T) {
  const [value, setValue] = useState<T>(initial)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A new flash owns the slot: any pending auto-hide from an earlier flash
  // must not clear this one early.
  const flash = (next: T, durationMs: number) => {
    clearTimeout(timerRef.current!)
    setValue(next)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setValue(initial)
    }, durationMs)
  }

  // No late setState after unmount: the pending auto-hide dies with the hook.
  useEffect(() => () => clearTimeout(timerRef.current!), [])

  return [value, { flash }] as const
}
