import { ArrowRight } from 'lucide-react'
import { useLandingCopy } from './landing-copy'

// The one call to action the whole page shares: open the studio route.
export function StudioCta({ large = false }: { large?: boolean }) {
  const t = useLandingCopy()
  return (
    <a
      href="/social-card/studio"
      className={`apple-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-accent font-semibold text-white shadow-sm hover:bg-accent-hover ${
        large ? 'px-7 py-3.5 text-base' : 'px-4 py-2 text-xs'
      }`}
    >
      {t.cta_open_studio}
      {large && <ArrowRight className="size-4" />}
    </a>
  )
}
