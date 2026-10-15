import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { Check } from 'lucide-react'

// Shared primitives layer (ADR 0001): a labeled checkbox that flips one
// boolean state field (e.g. bold sublines, uppercase headline). base-ui owns
// the checkbox ARIA and keyboard behavior; this component owns the row —
// box plus its visible label — and the studio skin.
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
      <BaseCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="flex size-4 items-center justify-center rounded border border-neutral-300 dark:border-neutral-600 bg-surface text-white transition-colors duration-150 ease-out hover:border-neutral-400 data-[checked]:border-accent data-[checked]:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer"
      >
        <BaseCheckbox.Indicator>
          <Check className="size-3" strokeWidth={3} />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
      >
        <span>{label}</span>
      </label>
    </div>
  )
}
