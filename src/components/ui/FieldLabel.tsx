import type { ReactNode } from 'react'

// Shared primitives layer (ADR 0001): the Inspector's field caption — the
// one label typography every section uses. `aside` renders the
// label-plus-companion row (counter badge, inline toggle) some sections
// frame their label with.
interface FieldLabelProps {
  children: ReactNode
  /** Needed when a control names this label via aria-labelledby. */
  id?: string
  htmlFor?: string
  /** Right-aligned companion in the label row. */
  aside?: ReactNode
}

export function FieldLabel({ children, id, htmlFor, aside }: FieldLabelProps) {
  const label = (
    <label id={id} htmlFor={htmlFor} className="text-xs font-medium text-ink-secondary">
      {children}
    </label>
  )
  if (!aside) {
    return label
  }
  return (
    <div className="flex items-center justify-between">
      {label}
      {aside}
    </div>
  )
}
