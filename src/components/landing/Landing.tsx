import { useEffect } from 'react'
import { CardTypes } from './CardTypes'
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
  // The browser's own hash scroll fires at navigation commit, before this
  // lazy chunk mounts — arrivals like /social-card/#cards from the nav on
  // other pages need one manual scroll once the sections exist.
  useEffect(() => {
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
  }, [])

  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas font-sans text-ink">
      <LandingNav />
      <LandingHero />
      <MarqueeTicker />
      <CardTypes />
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
