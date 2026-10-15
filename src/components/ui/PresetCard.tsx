import React from 'react'
import { clsx } from 'clsx'

// Shared primitives layer (ADR 0001): a preview-led preset affordance. The
// card owns the chrome — press feedback (`apple-button`), keyboard focus
// ring, active/selected state, and the `aria-pressed` toggle contract —
// while the preview itself is caller-supplied (each preset family renders
// its own miniature). Selection follows the studio idiom: the checked
// segment look (white card + blue ring), not a color inversion, so the
// theme-tinted previews always sit on a neutral surface.
interface PresetCardProps {
  label: string
  description?: string
  active: boolean
  onClick: () => void
  preview: React.ReactNode
  className?: string
}

export function PresetCard({
  label,
  description,
  active,
  onClick,
  preview,
  className,
}: PresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'apple-button flex w-full cursor-pointer flex-col items-stretch gap-1.5 rounded-xl border p-2 text-left select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 [@media(pointer:coarse)]:min-h-11',
        'transition-colors duration-150 ease-out',
        active
          ? 'border-blue-600/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07)] ring-1 ring-blue-600/60 dark:border-blue-500/60 dark:bg-[#2C2C2E] dark:ring-blue-500/60'
          : 'border-black/[0.06] bg-black/[0.04] hover:bg-black/[0.07] dark:border-white/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.09]',
        className,
      )}
    >
      {preview}
      <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{label}</span>
      {description && (
        <span className="text-[11px] leading-tight text-[#86868B] dark:text-[#A1A1A6]">
          {description}
        </span>
      )}
    </button>
  )
}
