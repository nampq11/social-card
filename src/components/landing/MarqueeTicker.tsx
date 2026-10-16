import { useLandingCopy } from './landing-copy'

// The capability ticker between the hero and the content: one strip of
// chips gliding left, tripled for a seamless one-strip-width loop (the
// landing-marquee-track keyframes live in index.css).
export function MarqueeTicker() {
  const t = useLandingCopy()

  const strip = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-3 pr-3">
      {t.marquee_items.map((item) => (
        <li
          key={item}
          className="whitespace-nowrap rounded-full border border-hairline bg-surface px-4 py-1.5 text-sm font-medium text-ink-secondary"
        >
          {item}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="overflow-hidden border-y border-hairline bg-surface/60 py-4">
      <div className="landing-marquee-track flex w-max">
        {strip(false)}
        {strip(true)}
        {strip(true)}
      </div>
    </div>
  )
}
