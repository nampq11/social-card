// The shared section rhythm: one vertical pacing for every landing
// section (py + anchor offset so the sticky nav never covers a heading)
// and one content column, so sections only declare what makes them unique.
export const SECTION_SPACING = 'scroll-mt-24 py-20 md:py-28'
export const SECTION_CONTAINER = 'mx-auto max-w-6xl px-6'

// The repeated section opening — eyebrow, headline, optional lede — one
// rhythm for every landing section, centered by default. Standalone pages
// (the feedback page) pass level 1 for their single page title.
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'center',
  level = 2,
}: {
  eyebrow: string
  title: string
  lede?: string
  align?: 'start' | 'center'
  level?: 1 | 2
}) {
  const Heading = level === 1 ? 'h1' : 'h2'
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="text-xs font-semibold tracking-[0.2em] text-accent">{eyebrow}</p>
      <Heading className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        {title}
      </Heading>
      {lede && <p className="mt-4 text-base text-ink-secondary md:text-lg">{lede}</p>}
    </div>
  )
}
