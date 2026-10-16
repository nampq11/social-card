import { Globe, Layers } from 'lucide-react'
import { useUiCopy } from '../../lib/i18n'
import { FEEDBACK_PATH, LANDING_PATH, resolveView } from '../../lib/view-route'
import { Button } from '../ui/Button'
import { useLandingCopy } from './landing-copy'
import { StudioCta } from './StudioCta'

// Floating glass bar mirroring the studio's own header — every landing
// page shows the same bar, so the product reads as one. Link targets
// derive from the same route source main.tsx branches on: on the landing
// itself the anchors stay local; on any other page they travel home
// first, and the logo returns home instead of scrolling to top.
export function LandingNav() {
  const t = useLandingCopy()
  const { language, setLanguage, copy } = useUiCopy()

  const onLanding = resolveView(window.location.pathname) === 'landing'
  const homeHref = onLanding ? '#top' : LANDING_PATH
  const sectionHref = (id: string) => `${onLanding ? '' : `${LANDING_PATH}/`}#${id}`

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <nav className="apple-glass mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl px-3.5 py-3">
        <a href={homeHref} className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-brand-from to-brand-to text-white shadow-sm shadow-blue-500/25">
            <Layers className="size-4" />
          </div>
          <span className="whitespace-nowrap text-[13px] font-semibold tracking-tight text-ink">
            Social Card
          </span>
        </a>

        <div className="hidden items-center gap-6 text-sm font-medium text-ink-secondary md:flex">
          <a className="transition-colors hover:text-ink" href={sectionHref('cards')}>
            {t.nav_cards}
          </a>
          <a className="transition-colors hover:text-ink" href={sectionHref('features')}>
            {t.nav_features}
          </a>
          <a className="transition-colors hover:text-ink" href={sectionHref('faq')}>
            {t.nav_faq}
          </a>
          <a className="transition-colors hover:text-ink" href={FEEDBACK_PATH}>
            {t.feedback_link}
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
