import type { ReactElement } from 'react'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'

// Shared primitives layer (ADR 0001): a hover/focus tooltip wrapping an
// existing trigger element (base-ui render prop, the TipsPopover idiom) —
// the child keeps its own semantics; this adds the floating label and the
// aria-describedby wiring. For icon buttons whose aria-label already names
// them, the tooltip is the sighted-user equivalent of that label. The
// z-50 keeps the flipped popup above the glass header's stacking context;
// disabled buttons need a hoverable wrapper span since the browser
// suppresses pointer events on them.
interface TooltipProps {
  /** Text shown in the floating tip. */
  label: string
  /** The trigger element — a single element, rendered in place. */
  children: ReactElement
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner sideOffset={6}>
          <BaseTooltip.Popup className="z-50 rounded-lg bg-surface border border-hairline px-2 py-1 text-xs text-ink shadow-md">
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
