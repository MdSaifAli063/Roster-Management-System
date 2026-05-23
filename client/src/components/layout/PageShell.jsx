import { useLocation } from 'react-router-dom';
import PageHeader, { usePageTitle } from '../PageHeader';
import { cn } from '../../lib/utils';

const MAX_WIDTH = {
  sm: 'mx-auto max-w-2xl w-full',
  md: 'mx-auto max-w-3xl w-full',
  lg: 'mx-auto max-w-4xl w-full',
  xl: 'mx-auto max-w-6xl w-full',
  full: 'w-full min-w-0',
};

/**
 * Standard page wrapper — dashboard-style shell, header, and responsive spacing.
 */
export default function PageShell({
  title,
  eyebrow,
  subtitle,
  actions,
  children,
  maxWidth = 'full',
  className,
  contentClassName,
  shell = true,
  noHeader = false,
}) {
  const location = useLocation();
  const meta = usePageTitle(location.pathname);

  return (
    <div
      className={cn(
        shell && 'app-page-shell',
        'space-y-6',
        className
      )}
    >
      {!noHeader && (
        <PageHeader
          pathname={location.pathname}
          title={title ?? meta.title}
          eyebrow={eyebrow ?? meta.eyebrow}
          subtitle={subtitle}
          actions={actions}
        />
      )}
      <div className={cn(MAX_WIDTH[maxWidth], contentClassName)}>{children}</div>
    </div>
  );
}
