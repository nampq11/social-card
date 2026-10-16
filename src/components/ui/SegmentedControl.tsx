import { useId, type ReactNode } from 'react'
import { handleRadioArrow } from './radio-navigation'

interface Option<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  'aria-labelledby'?: string
}

// Segmented control on native radios (ADR 0001): same-name inputs give the
// roving focus, arrow-key navigation with wrap-around, and radio ARIA for
// free; aria-checked is mirrored explicitly so the checked option stays
// observable as an attribute. This component keeps the call-site API
// (options/value/onChange) and the segmented visual design.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  'aria-labelledby': labelledBy,
}: SegmentedControlProps<T>) {
  const groupName = useId()
  const values = options.map((opt) => opt.value)
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      className={`w-full grid p-1 bg-black/[0.06] dark:bg-white/[0.08] rounded-xl border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md ${className}`}
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
              className={`flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[9px] transition-all duration-150 ease-out apple-button select-none cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60 [@media(pointer:coarse)]:min-h-11 ${
                checked
                  ? 'bg-surface-raised text-ink dark:text-white shadow-[0_2px_5px_rgba(0,0,0,0.09),0_0.5px_1px_rgba(0,0,0,0.06)] font-semibold'
                  : 'text-ink-muted dark:text-neutral-400 hover:text-ink dark:hover:text-white'
              }`}
            >
              {/* Lucide icons default to 24px regardless of the slot; force
                  them into it or they overflow and overlap the label. */}
              {opt.icon && (
                <span className="w-3.5 h-3.5 shrink-0 [&_svg]:size-full">{opt.icon}</span>
              )}
              <span>{opt.label}</span>
            </label>
          </div>
        )
      })}
    </div>
  )
}
