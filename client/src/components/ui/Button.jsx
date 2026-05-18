import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const buttonVariants = {
  primary: 'bg-navy text-white hover:bg-navy-dark shadow-sm',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200',
  teal: 'bg-teal text-white hover:bg-sky-600',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';

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
