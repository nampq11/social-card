import { useId } from 'react'
import { clsx } from 'clsx'
import { handleRadioArrow } from './radio-navigation'

// Shared primitives layer (ADR 0001): a color-swatch picker for options
// whose identity IS a color (card themes). Native same-name radios — radio
// ARIA, roving focus, arrow keys are the platform's job; aria-checked is
// mirrored explicitly so the checked option stays observable as an
// attribute. It stays a named radiogroup like the SegmentedControl it
// complements: swatches show the real color, segments spell out a choice.
// Each swatch keeps its visible caption (color alone can't tell "Trắng
// tinh" from "Giấy ngà"), which doubles as the radio's accessible name.
interface SwatchOption<T extends string> {
  value: T
  label: string
  // Fill class of the swatch circle (e.g. a theme's bg token).
  swatchClass: string
}

interface SwatchPickerProps<T extends string> {
  options: SwatchOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  'aria-labelledby'?: string
}

export function SwatchPicker<T extends string>({
  options,
  value,
  onChange,
  className = '',
  'aria-labelledby': labelledBy,
}: SwatchPickerProps<T>) {
  const groupName = useId()
  const values = options.map((opt) => opt.value)
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      className={`w-full grid gap-1 ${className}`}
    >
      {options.map((opt) => {
        const checked = opt.value === value
        return (
          <div key={opt.value} className="relative flex">
            <input
              type="radio"
              name={groupName}
              id={`${groupName}-${opt.value}`}
              value={opt.value}
              checked={checked}
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onChange={() => onChange(opt.value)}
              onKeyDown={(e) =>
                handleRadioArrow(
                  e,
                  values,
                  opt.value,
                  (next) => onChange(next as T),
                  (v) => `${groupName}-${v}`,
                )
              }
              className="sr-only peer"
            />
            <label
              htmlFor={`${groupName}-${opt.value}`}
              className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 select-none peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60 [@media(pointer:coarse)]:min-h-11"
            >
              {/* ring-offset against the glass panel approximates with its
                  dominant tone; the hairline keeps near-white swatches visible. */}
              <span
                aria-hidden
                className={clsx(
                  'size-7 rounded-full border border-black/10 transition-shadow duration-150 ease-out dark:border-white/20',
                  opt.swatchClass,
                  checked && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
                )}
              />
              <span
                className={clsx(
                  'text-[11px] leading-tight transition-colors duration-150 ease-out',
                  checked ? 'font-medium text-ink' : 'text-ink-tertiary',
                )}
              >
                {opt.label}
              </span>
            </label>
          </div>
        )
      })}
    </div>
  )
}
