import studioShot from '../../assets/landing/studio-desktop.png'
import { useLandingCopy } from './landing-copy'
import { StudioCta } from './StudioCta'

export function LandingHero() {
  const t = useLandingCopy()

  return (
    <section id="top" className="apple-canvas-bg relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center md:pb-28 md:pt-28">
        <p className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-secondary">
          <span className="size-2 rounded-full bg-green shadow-[0_0_6px_var(--color-green)]" />
          {t.hero_badge}
        </p>

        <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-ink md:text-7xl">
          {t.hero_title_a}
          <br />
          <span className="text-accent">{t.hero_title_b}</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-ink-secondary md:text-lg">
          {t.hero_lede}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:mt-12">
          <StudioCta large />
          <a
            href="#cards"
            className="apple-button inline-flex cursor-pointer items-center rounded-full border border-hairline bg-surface px-6 py-3 text-sm font-semibold text-ink hover:bg-surface-raised"
          >
            {t.hero_cta_secondary}
          </a>
          {/* The page's one handwritten aside — the annotation voice the
              Showcase Card itself uses (Patrick Hand, slight tilt). */}
          <span
            aria-hidden
            className="ms-2 hidden -rotate-3 font-hand text-xl text-accent sm:inline"
          >
            {t.hero_hint} →
          </span>
        </div>

        {/* Trust microcopy clusters with the actions it qualifies; the
            product shot below earns its own air — actions tight, visual
            loose. */}
        <p className="mt-5 text-sm text-ink-tertiary">{t.hero_trust}</p>

        <div className="mt-16 md:mt-20">
          <img
            src={studioShot}
            alt={t.hero_shot_alt}
            width={2880}
            height={1800}
            className="card-elevation mx-auto w-full max-w-5xl rounded-2xl"
          />
        </div>
      </div>
    </section>
  )
}
