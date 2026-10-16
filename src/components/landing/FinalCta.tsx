import { StudioCta } from './StudioCta'
import { useLandingCopy } from './landing-copy'

export function FinalCta() {
  const t = useLandingCopy()

  return (
    <section className="apple-canvas-bg py-24 text-center md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink md:text-5xl">
          {t.final_title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-secondary md:text-lg">{t.final_body}</p>
        <div className="mt-8">
          <StudioCta large />
        </div>
      </div>
    </section>
  )
}
