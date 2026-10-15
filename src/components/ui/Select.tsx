import type { SelectHTMLAttributes } from 'react'

// Shared field chrome for the Inspector's small form controls: the native
// select and the annotation text input dress identically except for the
// pointer cursor.
export const fieldSurfaceClass =
  'px-2 py-1.5 text-xs rounded-lg bg-surface border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-accent/40'

// Shared primitives layer (ADR 0001): a native <select> dressed in the
// field skin. Native on purpose — the option list is tiny (shot targets,
// annotation sides) and the OS menu beats a rebuilt one for keyboard,
// touch, and screen readers. Sizing (min-w-0 flex-1, w-full, …) stays at
// the call site via className.
export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldSurfaceClass} cursor-pointer ${className}`} />
}
