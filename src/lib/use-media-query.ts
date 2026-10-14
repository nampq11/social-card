import { useCallback, useSyncExternalStore } from 'react'

/**
 * Reactive matchMedia for the one breakpoint the studio owns: the Desktop
 * Shell (≥1024px) vs Mobile Shell split. JS-driven instead of CSS-hidden so
 * exactly one Inspector host is ever mounted — no duplicated ids/labels.
 * The media query list is an external system, so this is a plain
 * useSyncExternalStore subscription — no state, no effect re-sync races.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
