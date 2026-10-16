import { Check } from 'lucide-react'

// The check-bullet list shared by the card-type and studio sections.
export function PointList({ points }: { points: string[] }) {
  return (
    <ul className="space-y-2.5">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-2.5 text-sm text-ink-secondary">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Check className="size-3 stroke-[2.5]" />
          </span>
          {point}
        </li>
      ))}
    </ul>
  )
}
