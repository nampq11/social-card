# Performance Optimization Ideas Backlog

- Lazy load `html-to-image` in `src/lib/export.ts` using dynamic `import('html-to-image')` since image export is only invoked on user copy/download action.
- Lazy load `OnboardingTour` in `src/App.tsx` with `React.lazy()` so the entire spotlight tour engine (`ui/tour.tsx`, `@floating-ui/react-dom`, `cn`) is excluded from the initial critical bundle.
- Narrow `App.tsx` store subscription from `(s) => s.card` to only `(s) => s.card.ratio` and `(s) => s.card.cardType` to prevent wasteful top-level re-renders on every keystroke/drag.
- Strip unused font weights and styles from Google Fonts request in `index.html` (900, italic 500/600).
- Dynamically load or lazy load `QRCodeSVG` from `qrcode.react` only when `showQr` is true.
- Optimize Vite rollup build options (manual chunks for vendor libraries, terser/esbuild minification flags).
- Memoize `Header.tsx` and stabilize callback props to prevent header re-renders on canvas interactions.
- Optimize `useCardUpdate()` hook in `inspector-sections.tsx` with `useCallback` to prevent unnecessary child re-renders.
