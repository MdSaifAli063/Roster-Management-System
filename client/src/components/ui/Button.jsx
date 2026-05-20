import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const buttonVariants = {
  primary:
    'bg-gradient-to-r from-blue-600 to-blue-500 text-white border border-blue-500/30 btn-glow hover:from-blue-500 hover:to-blue-400',
  secondary:
    'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--glass-hover)]',
  outline:
    'bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--glass-hover)]',
  teal:
    'bg-gradient-to-r from-cyan-600 to-teal-500 text-white border border-cyan-500/30 btn-glow hover:from-cyan-500 hover:to-teal-400',
  ghost:
    'text-[var(--text-secondary)] border border-transparent hover:border-[var(--border)] hover:bg-[var(--glass-hover)] hover:text-[var(--text-primary)]',
  danger:
    'bg-gradient-to-r from-red-600 to-red-500 text-white border border-red-500/30 hover:from-red-500 hover:to-red-400',
};

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus-ring disabled:opacity-50 disabled:pointer-events-none';

export function buttonStyles(variant = 'primary', className) {
  return cn(baseStyles, buttonVariants[variant], className);
}

const Button = forwardRef(function Button(
  { className, variant = 'primary', as: Component = 'button', children, ...props },
  ref
) {
  return (
    <Component ref={ref} className={buttonStyles(variant, className)} {...props}>
      {children}
    </Component>
  );
});

export default Button;
