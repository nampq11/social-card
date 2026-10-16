// Shared primitives layer: one visual language for every button in the
// studio (Header actions, Inspector controls, app-root toolbar).
// `apple-button` carries the tactile press feedback defined in index.css.
// focus-visible ring: the one keyboard affordance every studio button shares.
import type { ButtonHTMLAttributes } from 'react'

const BUTTON_BASE =
  'inline-flex items-center justify-center text-xs apple-button cursor-pointer [&_svg]:size-3.5 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60'

const BUTTON_VARIANTS = {
  primary:
    'font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm hover:bg-neutral-800 dark:hover:bg-neutral-100',
  success: 'font-semibold bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
  secondary:
    'font-medium bg-black/[0.05] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.12]',
  ghost: 'font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300',
} as const

const BUTTON_SIZES = {
  sm: 'gap-1 rounded-lg px-2.5 py-1 [@media(pointer:coarse)]:min-h-11',
  md: 'gap-1.5 rounded-xl px-3.5 py-2 [@media(pointer:coarse)]:min-h-11',
  lg: 'gap-1.5 rounded-xl px-4 py-2 [@media(pointer:coarse)]:min-h-11',
  icon: 'rounded-lg p-1 [@media(pointer:coarse)]:min-w-11 [@media(pointer:coarse)]:min-h-11',
} as const

type ButtonStyle = keyof typeof BUTTON_VARIANTS
type ButtonScale = keyof typeof BUTTON_SIZES

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonStyle
  size?: ButtonScale
}

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  const base = `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`
  return <button type={type} className={className ? `${base} ${className}` : base} {...props} />
}
