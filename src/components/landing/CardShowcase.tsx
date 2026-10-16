import quoteShot from '../../assets/landing/card-quote-mist.png'
import showcaseShot from '../../assets/landing/card-showcase-paper.png'
import { PointList } from './PointList'
import { SectionHeading } from './SectionHeading'
import { useLandingCopy } from './landing-copy'

function CardExample({
  src,
  alt,
  name,
  desc,
  points,
}: {
  src: string
  alt: string
  name: string
  desc: string
  points: string[]
}) {
  return (
    <article className="flex flex-col rounded-3xl border border-hairline bg-surface p-6 md:p-8">
      <img
        src={src}
        alt={alt}
        width={1800}
        height={1800}
        loading="lazy"
        className="card-elevation mx-auto w-full max-w-sm rounded-2xl"
      />
      <h3 className="mt-8 text-xl font-bold text-ink">{name}</h3>
      <p className="mt-2 text-ink-secondary">{desc}</p>
      <div className="mt-4">
        <PointList points={points} />
      </div>
    </article>
  )
}

export function CardShowcase() {
  const t = useLandingCopy()

  return (
    <section id="cards" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow={t.cards_eyebrow} title={t.cards_title} lede={t.cards_lede} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <CardExample
            src={quoteShot}
            alt={t.card_quote_alt}
            name={t.quote_name}
            desc={t.quote_desc}
            points={t.quote_points}
          />
          <CardExample
            src={showcaseShot}
            alt={t.card_showcase_alt}
            name={t.showcase_name}
            desc={t.showcase_desc}
            points={t.showcase_points}
          />
        </div>
      </div>
    </section>
  )
}
