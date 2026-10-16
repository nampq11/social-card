import { ShieldCheck } from 'lucide-react'
import { SECTION_CONTAINER, SECTION_SPACING, SectionHeading } from './SectionHeading'
import { useLandingCopy } from './landing-copy'

export function HowItWorks() {
  const t = useLandingCopy()

  return (
    <section className={SECTION_SPACING}>
      <div className={SECTION_CONTAINER}>
        <SectionHeading eyebrow={t.how_eyebrow} title={t.how_title} />
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {t.how_steps.map((step, index) => (
            <li key={step.title} className="text-center">
              {/* Step numbers in the annotation hand — the studio's voice. */}
              <p className="mx-auto flex size-11 items-center justify-center rounded-full border border-hairline bg-surface font-hand text-2xl text-accent">
                {index + 1}
              </p>
              <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-ink-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-12 flex max-w-2xl items-center justify-center gap-2.5 rounded-2xl border border-hairline bg-surface px-5 py-4 text-sm text-ink-secondary">
          <ShieldCheck className="size-5 shrink-0 text-green" />
          <span>{t.how_privacy}</span>
        </p>
      </div>
    </section>
  )
}
