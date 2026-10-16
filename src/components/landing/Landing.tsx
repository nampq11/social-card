import { CardShowcase } from './CardShowcase'
import { Faq } from './Faq'
import { FeatureGrid } from './FeatureGrid'
import { FinalCta } from './FinalCta'
import { HowItWorks } from './HowItWorks'
import { LandingFooter } from './LandingFooter'
import { LandingHero } from './LandingHero'
import { LandingNav } from './LandingNav'
import { MarqueeTicker } from './MarqueeTicker'
import { RatioStrip } from './RatioStrip'
import { StudioSection } from './StudioSection'

// The marketing front door at /social-card — the scrolling counterpart to
// the viewport-locked studio at /social-card/studio. Section structure
// learns from tryonenotch.com; every color and surface comes from the
// app's own token vocabulary, so the landing follows OS dark mode like
// the studio does.
export function Landing() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas font-sans text-ink">
      <LandingNav />
      <LandingHero />
      <MarqueeTicker />
      <CardShowcase />
      <StudioSection />
      <RatioStrip />
      <FeatureGrid />
      <HowItWorks />
      <Faq />
      <FinalCta />
      <LandingFooter />
    </div>
  )
}
