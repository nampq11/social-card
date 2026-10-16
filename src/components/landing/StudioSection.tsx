import studioMobileShot from '../../assets/landing/studio-mobile.png'
import { PointList } from './PointList'
import { useLandingCopy } from './landing-copy'

// Left-copy / right-media split (the reference structure's alternation):
// the One-Screen Studio story told with the phone shell — same studio,
// folded into a bottom sheet.
export function StudioSection() {
  const t = useLandingCopy()

  return (
    <section id="studio" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-accent">{t.studio_eyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            {t.studio_title}
          </h2>
          <p className="mt-4 text-ink-secondary md:text-lg">{t.studio_body}</p>
          <div className="mt-6">
            <PointList points={t.studio_points} />
          </div>
        </div>

        <div className="justify-self-center">
          <div className="card-elevation w-72 rounded-[2.5rem] border border-hairline bg-surface p-2.5 md:w-80">
            <img
              src={studioMobileShot}
              alt={t.studio_shot_alt}
              width={780}
              height={1688}
              loading="lazy"
              className="w-full rounded-[2rem]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
