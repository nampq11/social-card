import React from 'react'
import { RadioGroup } from '@base-ui/react/radio-group'
import { Radio } from '@base-ui/react/radio'

interface Option<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  'aria-labelledby'?: string
}

// Segmented control built on base-ui's radio-group primitives (ADR 0001):
// radio ARIA, roving focus, arrow-key navigation with wrap-around and
// selection-follows-focus are the library's job — this component only keeps
// the call-site API (options/value/onChange) and the segmented visual design.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  'aria-labelledby': labelledBy,
}: SegmentedControlProps<T>) {
  return (
    <RadioGroup<T>
      value={value}
      onValueChange={(next) => {
        // Skip redundant Card State writes when the checked option is activated.
        if (next !== value) onChange(next)
      }}
      aria-labelledby={labelledBy}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      className={`w-full grid p-1 bg-black/[0.06] dark:bg-white/[0.08] rounded-xl border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md ${className}`}
    >
      {options.map((opt) => {
        const checked = opt.value === value
        return (
          <Radio.Root
            key={opt.value}
            value={opt.value}
            className={`relative flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[9px] transition-all duration-150 ease-out apple-button select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 [@media(pointer:coarse)]:min-h-11 ${
              checked
                ? 'bg-white dark:bg-[#2C2C2E] text-ink dark:text-white shadow-[0_2px_5px_rgba(0,0,0,0.09),0_0.5px_1px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-ink-muted dark:text-neutral-400 hover:text-ink dark:hover:text-white'
            }`}
          >
            {/* Lucide icons default to 24px regardless of the slot; force
                them into it or they overflow and overlap the label. */}
            {opt.icon && <span className="w-3.5 h-3.5 shrink-0 [&_svg]:size-full">{opt.icon}</span>}
            <span>{opt.label}</span>
          </Radio.Root>
        )
      })}
    </RadioGroup>
  )
}
