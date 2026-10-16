import { Layers } from 'lucide-react'
import { STUDIO_PATH } from '../../lib/view-route'
import { useLandingCopy } from './landing-copy'

const linkClass = 'text-ink-secondary transition-colors hover:text-ink'

// Brand names ("GitHub", "Threads") stay literal in both languages — they
// are the names, not UI Copy.
export function LandingFooter() {
  const t = useLandingCopy()

  return (
    <footer className="border-t border-hairline bg-canvas py-12 md:py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-b from-brand-from to-brand-to text-white">
              <Layers className="size-3.5" />
            </div>
            <span className="text-[13px] font-semibold text-ink">Social Card</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-tertiary">
            {t.footer_story}
          </p>
        </div>

        <nav aria-label={t.footer_product_heading}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {t.footer_product_heading}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a className={linkClass} href={STUDIO_PATH}>
                {t.cta_open_studio}
              </a>
            </li>
            <li>
              <a className={linkClass} href="#cards">
                {t.nav_cards}
              </a>
            </li>
            <li>
              <a className={linkClass} href="#features">
                {t.nav_features}
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label={t.footer_links_heading}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {t.footer_links_heading}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                className={linkClass}
                href="https://github.com/nampq11/social-card"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                className={linkClass}
                href="https://threads.net/@nampq"
                target="_blank"
                rel="noreferrer"
              >
                Threads
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <p className="mx-auto mt-10 max-w-6xl px-6 text-xs text-ink-tertiary">{t.footer_credit}</p>
    </footer>
  )
}
