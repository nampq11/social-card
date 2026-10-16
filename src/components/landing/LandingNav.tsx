import { Globe, Layers } from 'lucide-react'
import { useUiCopy } from '../../lib/i18n'
import { Button } from '../ui/Button'
import { useLandingCopy } from './landing-copy'
import { StudioCta } from './StudioCta'

// Floating glass bar mirroring the studio's own header — the landing and
// the app should read as one product.
export function LandingNav() {
  const t = useLandingCopy()
  const { language, setLanguage, copy } = useUiCopy()

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <nav className="apple-glass mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl px-3.5 py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-brand-from to-brand-to text-white shadow-sm shadow-blue-500/25">
            <Layers className="size-4" />
          </div>
          <span className="whitespace-nowrap text-[13px] font-semibold tracking-tight text-ink">
            Social Card
          </span>
        </a>

        <div className="hidden items-center gap-6 text-sm font-medium text-ink-secondary md:flex">
          <a className="transition-colors hover:text-ink" href="#cards">
            {t.nav_cards}
          </a>
          <a className="transition-colors hover:text-ink" href="#features">
            {t.nav_features}
          </a>
          <a className="transition-colors hover:text-ink" href="#faq">
            {t.nav_faq}
          </a>
        </div>

        <div className="flex items-center gap-2">
          {/* Same Interface Language toggle as the studio header — the
              choice persists across both views. */}
          <Button
            variant="secondary"
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            aria-label={copy.language_toggle_title}
            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
          >
            <Globe className="size-3.5" />
            <span>{language === 'vi' ? 'VI' : 'EN'}</span>
          </Button>
          <StudioCta />
        </div>
      </nav>
    </header>
  )
}
