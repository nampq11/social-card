import { RadioGroup } from '@base-ui/react/radio-group'
import { Radio } from '@base-ui/react/radio'
import { clsx } from 'clsx'

// Shared primitives layer (ADR 0001): a color-swatch picker for options
// whose identity IS a color (card themes). Built on base-ui's radio-group —
// radio ARIA, roving focus, arrow keys are the library's job — so it stays
// a named radiogroup like the SegmentedControl it complements: swatches
// show the real color, segments spell out a choice. Each swatch keeps its
// visible caption (color alone can't tell "Trắng tinh" from "Giấy ngà"),
// which doubles as the radio's accessible name.
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
  return (
    <RadioGroup<T>
      value={value}
      onValueChange={(next) => {
        // Skip redundant Card State writes when the checked option is activated.
        if (next !== value) onChange(next)
      }}
      aria-labelledby={labelledBy}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      className={`w-full grid gap-1 ${className}`}
    >
      {options.map((opt) => {
        const checked = opt.value === value
        return (
          <Radio.Root
            key={opt.value}
            value={opt.value}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 [@media(pointer:coarse)]:min-h-11"
          >
            {/* ring-offset against the glass panel approximates with its
                dominant tone; the hairline keeps near-white swatches visible. */}
            <span
              aria-hidden
              className={clsx(
                'size-7 rounded-full border border-black/10 transition-shadow duration-150 ease-out dark:border-white/20',
                opt.swatchClass,
                checked &&
                  'ring-2 ring-blue-600 ring-offset-2 ring-offset-surface dark:ring-blue-500',
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
          </Radio.Root>
        )
      })}
    </RadioGroup>
  )
}
