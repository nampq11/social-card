import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UiCopyProvider } from './lib/i18n'

const Analytics = import.meta.env.PROD
  ? lazy(() => import('@vercel/analytics/react').then((m) => ({ default: m.Analytics })))
  : () => null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiCopyProvider>
      <App />
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
