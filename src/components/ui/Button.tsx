import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';

// Shared primitives layer: one visual language for every button in the
// studio (Header actions, Inspector controls, app-root toolbar).
// `apple-button` carries the tactile press feedback defined in index.css.
const buttonVariants = cva(
  'inline-flex items-center justify-center text-xs apple-button cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm hover:bg-neutral-800 dark:hover:bg-neutral-100',
        success:
          'font-semibold bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
        secondary:
          'font-medium bg-black/[0.05] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.12]',
        ghost:
          'font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300',
      },
      size: {
        sm: 'gap-1 rounded-lg px-2.5 py-1',
        md: 'gap-1.5 rounded-xl px-3.5 py-2',
        lg: 'gap-1.5 rounded-xl px-4 py-2',
        icon: 'rounded-lg p-1',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonVariants;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
