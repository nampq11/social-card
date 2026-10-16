import { ChevronDown } from 'lucide-react'
import { SECTION_SPACING, SectionHeading } from './SectionHeading'
import { useLandingCopy } from './landing-copy'

// Native <details> accordion — keyboard- and screen-reader-accessible with
// zero JavaScript, which is all an FAQ ever needs.
export function Faq() {
  const t = useLandingCopy()

  return (
    <section id="faq" className={SECTION_SPACING}>
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow={t.faq_eyebrow} title={t.faq_title} />
        <div className="mt-10 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
          {t.faq_items.map((item) => (
            <details key={item.question} className="group px-5 md:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-ink md:text-base [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown className="size-4 shrink-0 text-ink-tertiary transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 pr-8 text-sm leading-relaxed text-ink-secondary">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
