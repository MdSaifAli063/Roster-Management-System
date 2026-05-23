import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  Megaphone,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';
import { initials, parseEmpName } from '../../lib/notifications';

function IconBadge({ children, className }) {
  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
        className
      )}
    >
      {children}
    </span>
  );
}

function AvatarBadge({ name }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-bold text-white">
      {initials(name)}
    </span>
  );
}

function UnreadDot({ show }) {
  if (!show) return <span className="w-2 shrink-0" />;
  return <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden />;
}

function DetailBox({ children, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'mt-2 flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-left text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-300',
        onClick && 'transition hover:bg-slate-100 dark:hover:bg-slate-800'
      )}
    >
      {children}
      {onClick && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
    </Tag>
  );
}

export default function NotificationItem({
  notification: n,
  isEmployer,
  onOpen,
  onMarkRead,
  onActionDone,
}) {
  const [acting, setActing] = useState(null);
  const toast = useToast();
  const p = n.payload || {};
  const empName = parseEmpName(n);
  const timeLabel = format(new Date(n.created_at), 'hh:mm a');

  const open = async () => {
    if (!n.is_read) await onMarkRead(n.id);
    onOpen(n);
  };

  const handleLeaveAction = async (e, action) => {
    e.stopPropagation();
    const leaveId = p.leaveId;
    if (!leaveId || acting) return;
    setActing(action);
    try {
      await api.put(`/leave/${leaveId}/${action}`);
      await onMarkRead(n.id);
      onActionDone?.();
      toast.success(action === 'approve' ? 'Leave approved' : 'Leave declined');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  const body = (content, { icon, avatar, footer }) => (
    <div
      className={cn(
        'flex gap-3 border-b border-slate-100 px-4 py-4 transition last:border-b-0 dark:border-slate-800',
        !n.is_read && 'bg-blue-50/40 dark:bg-blue-500/5'
      )}
    >
      {avatar ? <AvatarBadge name={avatar} /> : icon}
      <div className="min-w-0 flex-1">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1 text-sm leading-snug text-slate-700 dark:text-slate-200">
            {content}
          </div>
          <UnreadDot show={!n.is_read} />
        </div>
        {footer}
        <p className="mt-2 text-[11px] text-slate-400">{timeLabel}</p>
      </div>
    </div>
  );

  if (n.type === 'LEAVE_SUBMITTED' && isEmployer && p.leaveId && (!p.status || p.status === 'PENDING')) {
    return body(
      <>
        <span className="font-semibold text-slate-900 dark:text-white">{empName || 'An employee'}</span>{' '}
        has requested time off. Review it now.
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!acting}
            onClick={(e) => handleLeaveAction(e, 'reject')}
            className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          >
            {acting === 'reject' ? 'Declining…' : 'Declined'}
          </button>
          <button
            type="button"
            disabled={!!acting}
            onClick={(e) => handleLeaveAction(e, 'approve')}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {acting === 'approve' ? 'Approving…' : 'Approved'}
          </button>
        </div>
      </>,
      { avatar: empName || '?' }
    );
  }

  if (n.type === 'LEAVE_SUBMITTED') {
    return body(
      <>
        <button type="button" onClick={open} className="text-left">
          <span className="font-semibold text-blue-600 dark:text-blue-400">{empName || 'Employee'}</span>{' '}
          requested {p.leaveType || 'leave'}
          {p.startDate && (
            <>
              {' '}
              (<span className="font-semibold">{p.startDate}</span>
              {p.endDate && p.endDate !== p.startDate ? ` – ${p.endDate}` : ''})
            </>
          )}
          .
        </button>
      </>,
      { avatar: empName || '?' }
    );
  }

  if (n.type === 'LEAVE_APPROVED' || n.type === 'LEAVE_REJECTED') {
    const approved = n.type === 'LEAVE_APPROVED';
    return body(
      <>
        Your <span className="font-semibold">{p.leaveType || 'leave'}</span> request
        {p.startDate && (
          <>
            {' '}
            (<span className="font-semibold">{p.startDate}</span>
            {p.endDate && p.endDate !== p.startDate ? ` – ${p.endDate}` : ''})
          </>
        )}{' '}
        was <span className="font-semibold">{approved ? 'approved' : 'declined'}</span>
        {p.reviewerName ? (
          <>
            {' '}
            by <span className="font-semibold text-blue-600 dark:text-blue-400">{p.reviewerName}</span>
          </>
        ) : null}
        .
        <button type="button" onClick={open} className="mt-1 block text-xs font-medium text-blue-600 hover:underline">
          View leave
        </button>
      </>,
      {
        icon: (
          <IconBadge className={approved ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}>
            <Calendar className="h-5 w-5" />
          </IconBadge>
        ),
      }
    );
  }

  if (n.type === 'ATTENDANCE_MISMATCH') {
    return body(
      <>
        <span className="font-semibold text-slate-900 dark:text-white">Attendance review needed</span> —{' '}
        {p.summary || n.message}
        <DetailBox onClick={open}>
          <span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{p.count || 0}</span> mismatch
            {p.count === 1 ? '' : 'es'} recorded
            {p.date ? ` for ${p.date}` : ''}. Open actual roster to resolve.
          </span>
        </DetailBox>
      </>,
      {
        icon: (
          <IconBadge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <CalendarClock className="h-5 w-5" />
          </IconBadge>
        ),
      }
    );
  }

  if (n.type === 'ATTENDANCE_MARK') {
    return body(
      <>
        <span className="font-semibold text-blue-600 dark:text-blue-400">{p.empName || empName || 'Employee'}</span>{' '}
        marked <span className="font-semibold">{p.action === 'in' ? 'in' : 'out'}</span>
        {p.time ? (
          <>
            {' '}
            at <span className="font-semibold">{String(p.time).slice(0, 5)}</span>
          </>
        ) : null}
        .
        <button type="button" onClick={open} className="mt-1 block text-xs font-medium text-blue-600 hover:underline">
          View attendance
        </button>
      </>,
      { avatar: p.empName || empName || '?' }
    );
  }

  if (n.type === 'ATTENDANCE_CONFIRM') {
    return body(
      <>
        You marked <span className="font-semibold">{p.action === 'in' ? 'in' : 'out'}</span>
        {p.time ? (
          <>
            {' '}
            at <span className="font-semibold">{String(p.time).slice(0, 5)}</span>
          </>
        ) : null}
        .
      </>,
      {
        icon: (
          <IconBadge className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <CalendarCheck className="h-5 w-5" />
          </IconBadge>
        ),
      }
    );
  }

  if (n.type === 'REASSIGNMENT') {
    return body(
      <>
        <span className="font-semibold text-blue-600 dark:text-blue-400">{p.fromName || 'Employee'}</span> →{' '}
        <span className="font-semibold text-blue-600 dark:text-blue-400">{p.toName || 'Employee'}</span> on{' '}
        <span className="font-semibold">{p.date || 'scheduled date'}</span>
        {p.reason ? (
          <>
            . Reason: <span className="font-semibold">{p.reason}</span>
          </>
        ) : null}
        .
        <button type="button" onClick={open} className="mt-1 block text-xs font-medium text-blue-600 hover:underline">
          View reassignments
        </button>
      </>,
      {
        icon: (
          <IconBadge className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <RefreshCw className="h-5 w-5" />
          </IconBadge>
        ),
      }
    );
  }

  return body(
    <>
      <button type="button" onClick={open} className="w-full text-left">
        <span className="font-semibold text-slate-900 dark:text-white">{n.title}</span>
        {n.message ? <span className="mt-0.5 block text-slate-600 dark:text-slate-400">{n.message}</span> : null}
      </button>
      {n.link && (
        <Link
          to={n.link}
          onClick={() => onMarkRead(n.id)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          Open <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </>,
    {
      icon: (
        <IconBadge className="bg-slate-100 text-slate-500 dark:bg-slate-800">
          <Megaphone className="h-5 w-5" />
        </IconBadge>
      ),
    }
  );
}
