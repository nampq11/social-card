import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
import { UiCopyProvider } from './lib/i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiCopyProvider>
      <App />
    </UiCopyProvider>
    {/* Vercel Web Analytics only collects on real deployments — the PROD
        gate keeps local dev/preview sessions out of the dashboard. */}
    {import.meta.env.PROD && <Analytics />}
  </StrictMode>,
)
