import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { UiCopyProvider } from './lib/i18n'
import { resolveView } from './lib/view-route'

// The deploy serves one HTML for every /social-card/* path (vercel.json
// catch-all), so the two views split client-side here — and both are
// code-split: the landing entry never downloads the studio, and the studio
// keeps its own chunk for direct /social-card/studio visits.
// oxlint-disable react/only-export-components
const view = resolveView(window.location.pathname)

const Landing = lazy(() =>
  import('./components/landing/Landing').then((m) => ({ default: m.Landing })),
)

const Studio = lazy(() => import('./App.tsx'))

const Analytics = import.meta.env.PROD
  ? lazy(() => import('@vercel/analytics/react').then((m) => ({ default: m.Analytics })))
  : () => null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiCopyProvider>
      {/* The fallback keeps painting the shared canvas surface while a
          view chunk loads, so neither path ever flashes blank. */}
      <Suspense fallback={<div className="h-dvh apple-canvas-bg" />}>
        {view === 'studio' ? <Studio /> : <Landing />}
      </Suspense>
    </UiCopyProvider>
    {/* Vercel Web Analytics only collects on real deployments — the PROD
        gate keeps local dev/preview sessions out of the dashboard. */}
    {import.meta.env.PROD && (
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>
    )}
  </StrictMode>,
)
