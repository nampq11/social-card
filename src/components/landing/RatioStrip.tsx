import { EXPORT_PIXEL_RATIO, RATIO_INFO } from '../../constants/ratios'
import type { AspectRatio } from '../../types'
import { useUiCopy } from '../../lib/i18n'
import { SECTION_CONTAINER, SECTION_SPACING, SectionHeading } from './SectionHeading'
import { useLandingCopy } from './landing-copy'

const RATIOS: AspectRatio[] = ['1:1', '4:5', '16:9']

const BOX_ASPECT: Record<AspectRatio, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '16:9': 'aspect-video',
}

// The three export ratios drawn at their true proportions — the boxes lie
// on one baseline so the height difference is the point. Names, pixel
// sizes and platform strings come straight from RATIO_INFO, so this strip
// can never drift from what the studio really exports.
export function RatioStrip() {
  const t = useLandingCopy()
  const { language } = useUiCopy()

  return (
    <section id="ratios" className={SECTION_SPACING}>
      <div className={SECTION_CONTAINER}>
        <SectionHeading eyebrow={t.ratios_eyebrow} title={t.ratios_title} lede={t.ratios_lede} />
        <div className="mx-auto mt-12 flex max-w-3xl items-end justify-center gap-4 md:gap-8">
          {RATIOS.map((ratio) => {
            const info = RATIO_INFO[ratio]
            return (
              <figure key={ratio} className="max-w-[260px] flex-1">
                <div
                  className={`${BOX_ASPECT[ratio]} rounded-xl border-2 border-dashed border-canvas-dot bg-surface`}
                />
                <figcaption className="mt-3 text-center">
                  <p className="font-mono text-sm font-semibold text-ink">{ratio}</p>
                  <p className="mt-0.5 text-xs text-ink-tertiary">
                    {info.width * EXPORT_PIXEL_RATIO} × {info.height * EXPORT_PIXEL_RATIO} px
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">{info.platform[language]}</p>
                </figcaption>
              </figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}
