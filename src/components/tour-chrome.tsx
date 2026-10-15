import {
  TourArrow,
  TourClose,
  TourDescription,
  TourFooter,
  TourHeader,
  TourNext,
  TourPrev,
  TourSkip,
  TourStepCounter,
  TourTitle,
} from './ui/tour'
import { useUiCopy } from '../lib/i18n'

// The chrome every tour step renders into — one visual voice with the
// studio's frosted-glass panels. Class overrides replace the vendored
// defaults' (shadcn-token) colors via cn's tailwind-merge.
// max-w keeps the fixed w-80 card inside 320px-wide viewports (Fold cover,
// old SE) — 100vw minus the tour's 12px collision padding on each side.
export const TOUR_STEP_CARD_CLASS =
  'relative z-50 w-[320px] max-w-[calc(100vw-28px)] rounded-2xl bg-sheet backdrop-blur-xl ' +
  'border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_48px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.06)] p-4 sm:p-5 gap-3.5'

const STEP_TITLE_CLASS =
  'text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug'
const STEP_BODY_CLASS = 'text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400'

/** Header + body + controls shared by every step of every tour. */
export function StepContent({
  title,
  body,
  copy,
  lastLabel,
}: {
  title: string
  body: string
  copy: ReturnType<typeof useUiCopy>['copy']
  lastLabel?: string
}) {
  return (
    <>
      <TourArrow className="fill-sheet" />
      <TourClose
        aria-label={copy.tour_close}
        className="w-7 h-7 rounded-full border-none bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.16] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center justify-center transition cursor-pointer top-3.5 right-3.5"
      />
      <TourHeader className="flex flex-col gap-1 text-left pr-7">
        <TourTitle className={STEP_TITLE_CLASS}>{title}</TourTitle>
        <TourDescription className={STEP_BODY_CLASS}>{body}</TourDescription>
      </TourHeader>
      <TourFooter className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.07]">
        <TourStepCounter className="text-[11px] font-medium font-mono text-neutral-400 dark:text-neutral-500" />
        <div className="flex items-center gap-1.5">
          <TourPrev
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            {copy.tour_prev}
          </TourPrev>
          <TourSkip
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition"
          >
            {copy.tour_skip}
          </TourSkip>
          <TourNext
            variant="primary"
            size="sm"
            className="h-7 px-3.5 text-xs font-medium rounded-lg bg-[#0071E3] hover:bg-[#0077ED] active:scale-95 text-white shadow-xs transition"
          >
            {lastLabel ?? copy.tour_next}
          </TourNext>
        </div>
      </TourFooter>
    </>
  )
}
