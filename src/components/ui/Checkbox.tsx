// Shared primitives layer (ADR 0001): a labeled checkbox that flips one
// boolean state field (e.g. bold sublines, uppercase headline). The native
// input owns the checkbox role and keyboard toggling; this component owns
// the row — box plus its visible label — and the studio skin. aria-checked
// is mirrored explicitly (redundant for a native input but keeps the
// accessible state observable in one place); the checked mark is a data-URI
// background since inputs can't host child elements (.studio-check).
interface CheckboxProps {
  /** Associates the visible label with the box. */
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Checkbox({ id, label, checked, onCheckedChange }: CheckboxProps) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        aria-checked={checked}
        onChange={(e) => onCheckedChange(e.currentTarget.checked)}
        className="studio-check size-4 cursor-pointer appearance-none rounded border border-neutral-300 bg-surface transition-colors duration-150 ease-out hover:border-neutral-400 checked:border-accent checked:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-neutral-600"
      />
      <label
        htmlFor={id}
        className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400"
      >
        <span>{label}</span>
      </label>
    </div>
  )
}
