import type { KeyboardEvent } from 'react'

// Arrow-key roving for native radio groups (ADR 0001): native same-name
// inputs carry the ARIA, roving tab stop, and pointer behavior, but the
// arrow move must exist in JS for assistive tech and synthetic events.
// preventDefault stops the browser's own arrow default so the move happens
// exactly once; focus follows the selection (selection-follows-focus).
export function handleRadioArrow(
  event: KeyboardEvent<HTMLInputElement>,
  values: readonly string[],
  value: string,
  select: (next: string) => void,
  idFor: (value: string) => string,
) {
  const delta =
    event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : 0
  if (!delta) return
  event.preventDefault()
  const next = values[(values.indexOf(value) + delta + values.length) % values.length]
  select(next)
  document.getElementById(idFor(next))?.focus()
}
