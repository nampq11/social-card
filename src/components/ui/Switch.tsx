import { Switch as BaseSwitch } from '@base-ui/react/switch'

// Shared primitives layer (ADR 0001): an iOS Settings-style switch — green
// when on — for boolean rows the caller lays out (the identity rows have two
// different row grammars, so the row stays at the call site). base-ui owns
// the switch ARIA and keyboard behavior; the label arrives as the switch's
// accessible name.
interface SwitchProps {
  id: string
  /** Accessible name for the switch (the row's visible title). */
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Switch({ id, label, checked, onCheckedChange }: SwitchProps) {
  return (
    <BaseSwitch.Root
      id={id}
      aria-label={label}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="relative inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full bg-neutral-300 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 data-[checked]:bg-green dark:bg-neutral-600"
    >
      <BaseSwitch.Thumb className="absolute left-[2px] top-[2px] size-[18px] rounded-full bg-white shadow transition-transform duration-200 ease-out data-[checked]:translate-x-4" />
    </BaseSwitch.Root>
  )
}
