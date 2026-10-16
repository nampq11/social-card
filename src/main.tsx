import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { UiCopyProvider } from './lib/i18n'
import { resolveView } from './lib/view-route'
import { applyViewMeta } from './lib/view-meta'

// The deploy serves one HTML for every /social-card/* path (vercel.json
// catch-all), so the views split client-side here — and all of them are
// code-split: the landing entry never downloads the studio, the studio
// keeps its own chunk for direct /social-card/studio visits, and the
// feedback page splits the same way off its /social-card/feedback path.
// oxlint-disable react/only-export-components
const view = resolveView(window.location.pathname)
// Align the shared HTML's crawl identity with the view the catch-all
// served; the static landing tags cover scrapers that never run JS.
applyViewMeta(view)

const Landing = lazy(() =>
  import('./components/landing/Landing').then((m) => ({ default: m.Landing })),
)

const FeedbackPage = lazy(() =>
  import('./components/landing/FeedbackPage').then((m) => ({ default: m.FeedbackPage })),
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
        {view === 'studio' ? <Studio /> : view === 'feedback' ? <FeedbackPage /> : <Landing />}
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
