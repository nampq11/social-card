// jsdom ships no matchMedia; Sonner's Toaster reads (prefers-color-scheme)
// on mount and the app shell splits on (min-width: 1024px). Stub the missing
// global so tests exercise the real components — this is an environment
// shim, not a mocked boundary.
//
// Studio tests run the Desktop Shell, so min-width queries match and
// max-width queries don't. triggerMediaQuery lets hook tests drive changes.

interface StubMediaQueryList extends MediaQueryList {
  __set(matches: boolean): void;
}

const instances = new Map<string, StubMediaQueryList>();

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => {
    const existing = instances.get(query);
    if (existing) return existing;

    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mql = {
      matches: query.includes('min-width'),
      media: query,
      onchange: null,
      addListener: (cb: (event: MediaQueryListEvent) => void) => listeners.add(cb),
      removeListener: (cb: (event: MediaQueryListEvent) => void) => listeners.delete(cb),
      addEventListener: (_type: 'change', cb: (event: MediaQueryListEvent) => void) =>
        listeners.add(cb),
      removeEventListener: (_type: 'change', cb: (event: MediaQueryListEvent) => void) =>
        listeners.delete(cb),
      dispatchEvent: () => false,
      __set(next: boolean) {
        mql.matches = next;
        listeners.forEach((cb) => cb({ matches: next, media: query } as MediaQueryListEvent));
      },
    };
    instances.set(query, mql as StubMediaQueryList);
    return mql as StubMediaQueryList;
  }) as unknown as typeof window.matchMedia;
}

/** Flip a stubbed query so reactive consumers can be tested for real. */
export function triggerMediaQuery(query: string, matches: boolean): void {
  const mql = instances.get(query);
  if (!mql) throw new Error(`No stubbed matchMedia instance for "${query}"`);
  mql.__set(matches);
}
