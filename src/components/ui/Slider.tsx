import { Slider as BaseSlider } from '@base-ui/react/slider'

// Shared primitives layer (ADR 0001): a one-value range slider styled for
// the Inspector (accent fill, white thumb, a taller coarse-pointer touch
// zone). base-ui owns the slider ARIA, keyboard behavior, and the step
// default (1); the Array|number normalization of onValueChange folds into
// the scalar API.
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
  return (
    <BaseSlider.Root
      value={value}
      min={min}
      max={max}
      aria-labelledby={labelledBy}
      onValueChange={(v) => onValueChange(Array.isArray(v) ? v[0] : v)}
      className="flex min-w-0 flex-1 cursor-pointer select-none"
    >
      <BaseSlider.Control className="flex w-full touch-none items-center py-1 [@media(pointer:coarse)]:py-3">
        <BaseSlider.Track className="relative h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
          <BaseSlider.Indicator className="absolute h-full rounded-full bg-accent" />
          <BaseSlider.Thumb className="size-4 rounded-full border-2 border-accent bg-white shadow-sm [@media(pointer:coarse)]:size-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40" />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  )
}
