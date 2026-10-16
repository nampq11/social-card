// Shared primitives layer (ADR 0001): an iOS Settings-style switch — green
// when on — for boolean rows the caller lays out (the identity rows have two
// different row grammars, so the row stays at the call site). A native
// checkbox carrying role="switch" is the ARIA switch pattern: role, name,
// keyboard toggling, and pointer target all stay native; aria-checked is
// mirrored explicitly because the switch role maps checkedness through ARIA,
// not the native state. The thumb is a sibling span (peer) since inputs
// can't host children.
interface SwitchProps {
  id: string
  /** Accessible name for the switch (the row's visible title). */
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Switch({ id, label, checked, onCheckedChange }: SwitchProps) {
  return (
    <label htmlFor={id} className="relative inline-flex shrink-0 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onCheckedChange(e.currentTarget.checked)}
        className="peer h-[22px] w-[38px] cursor-pointer appearance-none rounded-full bg-neutral-300 transition-colors duration-200 ease-out checked:bg-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:bg-neutral-600"
      />
      <span className="pointer-events-none absolute left-[2px] top-[2px] size-[18px] rounded-full bg-white shadow transition-transform duration-200 ease-out peer-checked:translate-x-4" />
    </label>
  )
}
