import type { CSSProperties } from 'react'

// Shared primitives layer (ADR 0001): a one-value native range input styled
// for the Inspector (.studio-range in index.css: accent fill, white thumb,
// taller coarse-pointer touch zone). The native element owns pointer
// dragging, the slider role, and the value contract; the keydown handler
// mirrors the platform ±1 step (clamped) with preventDefault so browsers
// don't double-step.
interface SliderProps {
  value: number
  min: number
  max: number
  'aria-labelledby': string
  onValueChange: (value: number) => void
}

export function Slider({
  value,
  min,
  max,
  'aria-labelledby': labelledBy,
  onValueChange,
}: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={1}
      aria-valuenow={value}
      aria-labelledby={labelledBy}
      onChange={(e) => onValueChange(e.currentTarget.valueAsNumber)}
      onKeyDown={(e) => {
        const delta =
          e.key === 'ArrowRight' || e.key === 'ArrowUp'
            ? 1
            : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
              ? -1
              : 0
        if (!delta) return
        e.preventDefault()
        onValueChange(Math.min(max, Math.max(min, value + delta)))
      }}
      className="studio-range min-w-0 flex-1 cursor-pointer select-none py-1 [@media(pointer:coarse)]:py-3"
      style={{ '--fill': `${fill}%` } as CSSProperties}
    />
  )
}
