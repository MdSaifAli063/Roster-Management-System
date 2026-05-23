import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

export const LOGO_FULL_SRC = '/rosterpro-logo.png';
export const LOGO_FULL_DARK_SRC = '/rosterpro-logo-dark.png';
export const LOGO_ICON_SRC = '/rosterpro-icon.png';
export const LOGO_ICON_DARK_SRC = '/rosterpro-icon-dark.png';
export const LOGO_ALT = 'RosterPro — Smart Scheduling Solutions';

/** Full horizontal logo — width scales from height (≈3.7:1). */
const FULL_SIZE = {
  sm: 'h-12',
  md: 'h-14 sm:h-16',
  lg: 'h-16 sm:h-[4.25rem]',
  xl: 'h-20 sm:h-24',
  hero: 'h-24 sm:h-28 md:h-32',
};

const MARK_SIZE = {
  sm: 'h-10 w-10',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
};

/**
 * @param {'full' | 'mark'} variant — full logo or icon-only (collapsed sidebar)
 * @param {'auto' | 'light' | 'dark'} theme — auto follows app theme; force for fixed backgrounds
 */
export default function Logo({
  variant = 'full',
  size = 'md',
  theme = 'auto',
  className,
  imgClassName,
  linkTo,
  onClick,
}) {
  const { dark: appDark } = useTheme();
  const onDark = theme === 'dark' || (theme === 'auto' && appDark);

  const fullSrc = onDark ? LOGO_FULL_DARK_SRC : LOGO_FULL_SRC;
  const iconSrc = onDark ? LOGO_ICON_DARK_SRC : LOGO_ICON_SRC;

  const imgClasses = cn(
    'shrink-0 select-none [image-rendering:-webkit-optimize-contrast]',
    onDark
      ? [
          'contrast-[1.06] brightness-[1.04] saturate-[1.08]',
          'drop-shadow-[0_0_1px_rgba(255,255,255,0.45)]',
          'drop-shadow-[0_2px_14px_rgba(56,189,248,0.22)]',
        ]
      : 'drop-shadow-[0_1px_2px_rgba(15,23,42,0.06)]',
    variant === 'mark'
      ? cn('object-contain object-center', MARK_SIZE[size] || MARK_SIZE.md)
      : cn('block w-auto max-w-none object-contain object-left', FULL_SIZE[size] || FULL_SIZE.md),
    className,
    imgClassName
  );

  const image = (
    <img
      src={variant === 'mark' ? iconSrc : fullSrc}
      alt={LOGO_ALT}
      className={imgClasses}
      decoding="async"
      draggable={false}
    />
  );

  const body = (
    <span
      className={cn(
        'inline-flex items-center',
        onDark && variant === 'full' && 'rounded-lg px-0.5',
        linkTo && 'transition-opacity hover:opacity-90'
      )}
    >
      {image}
    </span>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} onClick={onClick} className="inline-flex min-w-0 items-center">
        {body}
      </Link>
    );
  }

  return body;
}
