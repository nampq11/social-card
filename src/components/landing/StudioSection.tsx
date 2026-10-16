import studioMobileShot from '../../assets/landing/studio-mobile.png'
import { PointList } from './PointList'
import { SECTION_CONTAINER, SECTION_SPACING, SectionHeading } from './SectionHeading'
import { useLandingCopy } from './landing-copy'

// Left-copy / right-media split (the reference structure's alternation):
// the One-Screen Studio story told with the phone shell — same studio,
// folded into a bottom sheet.
export function StudioSection() {
  const t = useLandingCopy()

  return (
    <section id="studio" className={SECTION_SPACING}>
      <div className={`grid ${SECTION_CONTAINER} items-center gap-12 md:grid-cols-2 md:gap-16`}>
        <div>
          <SectionHeading
            align="start"
            eyebrow={t.studio_eyebrow}
            title={t.studio_title}
            lede={t.studio_body}
          />
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
