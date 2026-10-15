import type { ReactElement } from 'react'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'

// Shared primitives layer (ADR 0001): a hover/focus tooltip wrapping an
// existing trigger element (base-ui render prop, the TipsPopover idiom) —
// the child keeps its own semantics; this adds the floating label and the
// aria-describedby wiring. For icon buttons whose aria-label already names
// them, the tooltip is the sighted-user equivalent of that label.
interface TooltipProps {
  /** Text shown in the floating tip. */
  label: string
  /** The trigger element — a single element, rendered in place. */
  children: ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6}>
          <BaseTooltip.Popup className="rounded-lg bg-surface border border-black/[0.08] dark:border-white/[0.1] px-2 py-1 text-xs text-ink shadow-md">
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
