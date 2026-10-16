// The repeated section opening — eyebrow, headline, optional lede — one
// rhythm for every centered landing section.
export function SectionHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string
  title: string
  lede?: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h2>
      {lede && <p className="mt-4 text-base text-ink-secondary md:text-lg">{lede}</p>}
    </div>
  )
}
