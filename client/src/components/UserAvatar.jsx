import { cn } from '../lib/utils';

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function UserAvatar({ user, size = 'md', className }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-20 w-20 text-2xl',
    xl: 'h-28 w-28 text-3xl',
  };

  const avatarUrl = user?.avatar_url;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={user?.name || 'Profile'}
        className={cn('shrink-0 rounded-full object-cover ring-2 ring-[var(--border)]', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 font-bold text-white ring-2 ring-[var(--border)]',
        sizes[size],
        className
      )}
    >
      {getInitials(user?.name)}
    </div>
  );
}
