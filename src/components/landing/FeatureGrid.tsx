import {
  Compass,
  Hand,
  Languages,
  Palette,
  QrCode,
  ShieldCheck,
  Sparkles,
  Undo2,
} from 'lucide-react'
import { SECTION_CONTAINER, SECTION_SPACING, SectionHeading } from './SectionHeading'
import { useLandingCopy } from './landing-copy'

// One icon per grid item, by position — decoration only; the copy module
// owns the content, this array just paces the visuals.
const ITEM_ICONS = [Palette, Sparkles, Hand, QrCode, Undo2, Compass, Languages, ShieldCheck]

export function FeatureGrid() {
  const t = useLandingCopy()

  return (
    <section id="features" className={`${SECTION_SPACING} border-y border-hairline bg-surface/50`}>
      <div className={SECTION_CONTAINER}>
        <SectionHeading eyebrow={t.grid_eyebrow} title={t.grid_title} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.grid_items.map((item, index) => {
            const Icon = ITEM_ICONS[index % ITEM_ICONS.length]
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-hairline bg-surface p-5"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="size-4.5" />
                </span>
                <h3 className="mt-3.5 text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
