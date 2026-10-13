// jsdom ships no matchMedia; Sonner's Toaster reads (prefers-color-scheme)
// on mount. Stub the missing global so app-root tests exercise the real
// component — this is an environment shim, not a mocked boundary.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
