import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Save,
  Share2,
  User,
  Plus,
  LayoutGrid,
  List,
  Printer,
  Undo2,
  Redo2,
  X,
} from 'lucide-react';
import api from '../api/client';
import Button from './ui/Button';
import ShiftEditModal from './AssignModal';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { eachDate } from '../lib/utils';
import {
  computeTotalHours,
  formatTime12,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  shiftBarPercent,
  clickMinutesFromRatio,
  minutesToTime,
  timeToMinutes,
} from '../lib/rosterTime';

const HOUR_LABELS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR },
  (_, i) => TIMELINE_START_HOUR + i
);

function cellKey(empId, dateStr) {
  return `${empId}-${dateStr}`;
}

function formatHourLabel(h) {
  if (h === 0 || h === 24) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

function cloneMap(map) {
  return JSON.parse(JSON.stringify(map));
}

function parseCellKey(key) {
  const m = String(key).match(/^(\d+)-(\d{4}-\d{2}-\d{2})$/);
  if (!m) return null;
  return { empId: Number(m[1]), date: m[2] };
}

function cellToApiBody(cell) {
  return {
    status: cell.status,
    shift_id: cell.shift_id ?? null,
    shift_start: cell.shift_start ?? null,
    shift_end: cell.shift_end ?? null,
    mandatory_start: cell.mandatory_start ?? null,
    mandatory_end: cell.mandatory_end ?? null,
    break_minutes: Number(cell.break_minutes) || 0,
  };
}

export default function RosterTimelineEditor({
  startDate,
  endDate,
  plantId,
  initialEmployees = [],
  onExit,
}) {
  const toast = useToast();
  const isNarrow = useMediaQuery('(max-width: 767px)');
  const [allEmployees, setAllEmployees] = useState(initialEmployees);
  const [rosterMap, setRosterMap] = useState({});
  const [rows, setRows] = useState([]);
  const [focusDate, setFocusDate] = useState(startDate);
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [periodStatus, setPeriodStatus] = useState('DRAFT');
  const [modal, setModal] = useState({ open: false, employee: null, date: null, cell: null });
  const [weekOffset, setWeekOffset] = useState(0);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isNarrow) setViewMode('list');
  }, [isNarrow]);

  const periodDates = useMemo(
    () => eachDate(startDate, endDate).map((d) => format(d, 'yyyy-MM-dd')),
    [startDate, endDate]
  );

  const visibleDays = useMemo(() => {
    const chunk = periodDates.slice(weekOffset * 7, weekOffset * 7 + 7);
    return chunk.length ? chunk : periodDates.slice(0, 7);
  }, [periodDates, weekOffset]);

  const maxWeekOffset = Math.max(0, Math.ceil(periodDates.length / 7) - 1);

  const loadRoster = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const empIds = allEmployees.map((e) => e.id).join(',');
      const { data } = await api.get('/rosters', {
        params: { emp_ids: empIds, start_date: startDate, end_date: endDate },
      });
      const map = {};
      const empSet = new Set(allEmployees.map((e) => e.id));
      (data || []).forEach((r) => {
        const d = String(r.roster_date).slice(0, 10);
        map[cellKey(r.emp_id, d)] = r;
        empSet.add(r.emp_id);
      });
      setRosterMap(map);

      const list = allEmployees.length ? allEmployees : [];
      setRows(
        list.length
          ? list.map((e) => ({ rowId: `r-${e.id}`, empId: e.id }))
          : [{ rowId: 'new-1', empId: null }]
      );

      const { data: status } = await api.get('/rosters/period-status', {
        params: { start_date: startDate, end_date: endDate, plant_id: plantId || undefined },
      });
      setPeriodStatus(status?.status || 'DRAFT');
      setUndoStack([]);
      setRedoStack([]);
      setDirty(false);
    } catch {
      setRosterMap({});
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, allEmployees, plantId]);

  const pushUndo = useCallback(() => {
    setUndoStack((s) => [...s.slice(-49), cloneMap(rosterMap)]);
    setRedoStack([]);
  }, [rosterMap]);

  const setMapWithHistory = useCallback(
    (updater) => {
      setUndoStack((s) => [...s.slice(-49), cloneMap(rosterMap)]);
      setRedoStack([]);
      setRosterMap(updater);
      setDirty(true);
    },
    [rosterMap]
  );

  const undo = useCallback(() => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((s) => [cloneMap(rosterMap), ...s.slice(0, 49)]);
    setUndoStack((s) => s.slice(0, -1));
    setRosterMap(prev);
    setDirty(true);
  }, [undoStack, rosterMap]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const next = redoStack[0];
    setUndoStack((s) => [...s.slice(-49), cloneMap(rosterMap)]);
    setRedoStack((s) => s.slice(1));
    setRosterMap(next);
    setDirty(true);
  }, [redoStack, rosterMap]);

  useEffect(() => {
    if (initialEmployees.length) {
      setAllEmployees(initialEmployees);
    } else if (!allEmployees.length) {
      api.get('/employees').then((r) => setAllEmployees(r.data || []));
    }
  }, [initialEmployees]);

  useEffect(() => {
    if (allEmployees.length && startDate && endDate) loadRoster();
  }, [loadRoster, allEmployees.length, startDate, endDate]);

  useEffect(() => {
    if (periodDates.length && !periodDates.includes(focusDate)) {
      setFocusDate(periodDates[0]);
    }
  }, [periodDates, focusDate]);

  const focusLabel = focusDate ? format(parseISO(focusDate), 'EEEE') : '';

  const dayMetrics = useMemo(() => {
    let hours = 0;
    let cost = 0;
    rows.forEach(({ empId }) => {
      if (!empId) return;
      const cell = rosterMap[cellKey(empId, focusDate)];
      if (cell?.status === 'W') {
        const h =
          cell.total_hours ??
          computeTotalHours(cell.shift_start, cell.shift_end, cell.break_minutes);
        hours += Number(h) || 0;
        const emp = allEmployees.find((e) => e.id === empId);
        cost += (Number(h) || 0) * (Number(emp?.hourly_rate) || 0);
      }
    });
    return { hours: Math.round(hours * 100) / 100, cost: Math.round(cost * 100) / 100 };
  }, [rows, rosterMap, focusDate, allEmployees]);

  const hourDensity = useMemo(() => {
    return HOUR_LABELS.map((hour) => {
      const hourStart = hour * 60;
      const hourEnd = hourStart + 60;
      let count = 0;
      rows.forEach(({ empId }) => {
        if (!empId) return;
        const cell = rosterMap[cellKey(empId, focusDate)];
        if (cell?.status !== 'W' || !cell.shift_start || !cell.shift_end) return;
        const s = timeToMinutes(cell.shift_start);
        const e = timeToMinutes(cell.shift_end);
        if (s < hourEnd && e > hourStart) count += 1;
      });
      return count;
    });
  }, [rows, rosterMap, focusDate]);

  const getEmployee = (empId) => allEmployees.find((e) => e.id === empId);

  const applyCellLocal = (empId, dateStr, saved) => {
    setRosterMap((prev) => ({
      ...prev,
      [cellKey(empId, dateStr)]: {
        ...prev[cellKey(empId, dateStr)],
        ...saved,
        emp_id: empId,
        roster_date: dateStr,
      },
    }));
    setDirty(true);
  };

  const saveAll = useCallback(async () => {
    setSaving(true);
    try {
      let count = 0;
      for (const [key, cell] of Object.entries(rosterMap)) {
        const parsed = parseCellKey(key);
        if (!parsed || !cell) continue;
        await api.put(`/rosters/cell/${parsed.empId}/${parsed.date}`, cellToApiBody(cell));
        count++;
      }
      setDirty(false);
      setUndoStack([]);
      setRedoStack([]);
      await loadRoster();
      toast?.success?.(`Saved ${count} roster cell(s)`);
    } catch (err) {
      toast?.error?.(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [rosterMap, loadRoster, toast]);

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
      if (e.key === 's') {
        e.preventDefault();
        saveAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, saveAll]);

  const openEdit = (empId, dateStr, cell) => {
    const employee = getEmployee(empId);
    if (!employee) return;
    pushUndo();
    setModal({ open: true, employee, date: dateStr, cell: cell || { status: 'W' } });
  };

  const handleTrackClick = (e, empId) => {
    if (!empId) {
      toast?.error?.('Select a staff member first');
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const startMin = clickMinutesFromRatio(ratio);
    const endMin = Math.min(startMin + 8 * 60, TIMELINE_END_HOUR * 60);
    const cell = rosterMap[cellKey(empId, focusDate)];
    if (cell?.status === 'LEAVE' || cell?.status === 'H' || cell?.status === 'PH') return;
    openEdit(empId, focusDate, {
      ...cell,
      status: 'W',
      shift_start: minutesToTime(startMin),
      shift_end: minutesToTime(endMin),
      break_minutes: cell?.break_minutes || 0,
    });
  };

  const addRow = () => {
    setRows((r) => [...r, { rowId: `new-${Date.now()}`, empId: null }]);
  };

  const setRowEmployee = (rowId, empId) => {
    setRows((r) => r.map((row) => (row.rowId === rowId ? { ...row, empId: empId ? Number(empId) : null } : row)));
  };

  const clearDay = () => {
    if (!window.confirm(`Clear all shifts for ${focusLabel} ${focusDate}?`)) return;
    setMapWithHistory((prev) => {
      const next = { ...prev };
      rows.forEach(({ empId }) => {
        if (!empId) return;
        const k = cellKey(empId, focusDate);
        next[k] = {
          ...next[k],
          emp_id: empId,
          roster_date: focusDate,
          status: 'WO',
          shift_id: null,
          shift_start: null,
          shift_end: null,
          break_minutes: 0,
          total_hours: 0,
        };
      });
      return next;
    });
    toast?.info?.('Day cleared — click Save to apply');
  };

  const deletePeriod = () => {
    if (!window.confirm('Delete all roster entries for this period?')) return;
    setMapWithHistory((prev) => {
      const next = { ...prev };
      periodDates.forEach((dateStr) => {
        rows.forEach(({ empId }) => {
          if (!empId) return;
          const k = cellKey(empId, dateStr);
          next[k] = {
            ...next[k],
            emp_id: empId,
            roster_date: dateStr,
            status: 'WO',
            shift_id: null,
            shift_start: null,
            shift_end: null,
            break_minutes: 0,
            total_hours: 0,
          };
        });
      });
      return next;
    });
    toast?.info?.('Roster cleared — click Save to apply');
  };

  const publishRoster = async (sendEmail) => {
    if (dirty) {
      const ok = window.confirm('Save unsaved changes before publishing?');
      if (!ok) return;
      await saveAll();
    }
    setPublishing(true);
    try {
      const { data } = await api.post('/rosters/publish', {
        start_date: startDate,
        end_date: endDate,
        plant_id: plantId,
        send_email: sendEmail,
      });
      setPeriodStatus('PUBLISHED');
      toast?.success?.(
        sendEmail
          ? `Published — ${data.emailed ?? 0} email(s) sent`
          : 'Roster published'
      );
    } catch (err) {
      toast?.error?.(err.response?.data?.error || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const rowTotalHours = (empId) => {
    const cell = rosterMap[cellKey(empId, focusDate)];
    if (!cell || cell.status !== 'W') return '0.00';
    const h =
      cell.total_hours ?? computeTotalHours(cell.shift_start, cell.shift_end, cell.break_minutes);
    return Number(h).toFixed(2);
  };

  if (loading && !rows.length) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-[var(--text-secondary)]">
        Loading roster editor…
      </div>
    );
  }

  return (
    <div className="roster-timeline flex min-w-0 w-full flex-col">
      <div className="roster-timeline-header rounded-t-xl px-3 py-4 sm:px-6" id="roster-timeline-print">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-bold text-white sm:text-2xl">Edit Roster</h1>
            <p className="mt-1 flex flex-col gap-1 text-sm text-white/90 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-0">
              <span>
                <span className="font-semibold text-white">{dayMetrics.hours.toFixed(2)} Hours</span>
                {' '}Rostered for {focusLabel}
              </span>
              <span className="hidden text-white/50 sm:inline sm:mx-2">·</span>
              <span>
                <span className="font-semibold text-white">${dayMetrics.cost.toFixed(2)}</span>
                {' '}Total Cost for {focusLabel}
              </span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {dirty && (
                <span className="rounded bg-amber-400/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-100">
                  Unsaved changes
                </span>
              )}
              {periodStatus === 'PUBLISHED' && (
                <span className="rounded bg-emerald-400/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100">
                  Published
                </span>
              )}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <button
              type="button"
              className="roster-timeline-action-btn w-full justify-center sm:w-auto"
              onClick={deletePeriod}
              disabled={saving || publishing}
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
              Delete roster
            </button>
            <button
              type="button"
              className="roster-timeline-action-btn w-full justify-center sm:w-auto"
              onClick={saveAll}
              disabled={saving}
              title={dirty ? 'Save all changes to server' : 'No unsaved changes'}
            >
              Save
              <Save className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="roster-timeline-action-btn w-full justify-center sm:w-auto"
              onClick={() => {
                const send = window.confirm('Send roster emails to employees with Excel + PDF attachments?');
                publishRoster(send);
              }}
              disabled={publishing || saving}
            >
              Publish
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="roster-timeline-util-row mt-4 flex flex-wrap items-center gap-2 pt-4">
          <button
            type="button"
            className="roster-timeline-action-btn"
            onClick={clearDay}
            disabled={saving}
          >
            Clear day
          </button>
          <button
            type="button"
            className="roster-timeline-icon-btn"
            onClick={undo}
            disabled={!undoStack.length}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="roster-timeline-icon-btn"
            onClick={redo}
            disabled={!redoStack.length}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="roster-timeline-icon-btn"
            onClick={() => window.print()}
            title="Print"
            aria-label="Print"
          >
            <Printer className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--border)] border-t-0 bg-[var(--bg-secondary)] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" className="text-xs" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" /> Add row
          </Button>
          {onExit && (
            <Button type="button" variant="outline" className="text-xs" onClick={onExit}>
              Exit editor
            </Button>
          )}
        </div>
        <div className="flex rounded-lg border border-[var(--border)] p-0.5">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition',
              viewMode === 'grid' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'
            )}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition',
              viewMode === 'list' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'
            )}
            onClick={() => setViewMode('list')}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex items-center gap-1 border-x border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-2 sm:px-4">
        <button
          type="button"
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]"
          disabled={weekOffset <= 0}
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
          aria-label="Previous week"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]"
          disabled={!periodDates.length || periodDates.indexOf(focusDate) <= 0}
          onClick={() => {
            const i = periodDates.indexOf(focusDate);
            if (i > 0) setFocusDate(periodDates[i - 1]);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 gap-1 overflow-x-auto pb-1">
          {visibleDays.map((d) => {
            const active = d === focusDate;
            const dt = parseISO(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setFocusDate(d)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-2 text-center text-xs font-medium transition sm:px-4 sm:text-sm',
                  active
                    ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-blue-500/25'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]'
                )}
              >
                <span className="block">{format(dt, 'EEE')}</span>
                <span className={cn('block font-mono text-[10px]', active ? 'text-white/90' : '')}>
                  {format(dt, 'dd/MM')}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]"
          disabled={periodDates.indexOf(focusDate) >= periodDates.length - 1}
          onClick={() => {
            const i = periodDates.indexOf(focusDate);
            if (i < periodDates.length - 1) setFocusDate(periodDates[i + 1]);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]"
          disabled={weekOffset >= maxWeekOffset}
          onClick={() => setWeekOffset((w) => Math.min(maxWeekOffset, w + 1))}
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="overflow-x-auto border border-t-0 border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="min-w-[960px]">
            {/* Density row */}
            <div className="roster-timeline-grid border-b border-[var(--border)] bg-[var(--bg-elevated)]">
              <div className="border-r border-[var(--border)] p-2" />
              <div
                className="grid min-w-0"
                style={{ gridTemplateColumns: `repeat(${HOUR_LABELS.length}, minmax(44px, 1fr))` }}
              >
                {hourDensity.map((n, i) => (
                  <div key={i} className="border-l border-[var(--border)] py-1 text-center text-[10px] text-[var(--text-secondary)]">
                    {n > 0 ? (Number.isInteger(n) ? n : n.toFixed(2)) : '0'}
                  </div>
                ))}
              </div>
              <div className="border-l border-[var(--border)]" />
            </div>
            {/* Hour labels */}
            <div className="roster-timeline-grid border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="border-r border-[var(--border)] px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Staff
              </div>
              <div
                className="grid min-w-0"
                style={{ gridTemplateColumns: `repeat(${HOUR_LABELS.length}, minmax(44px, 1fr))` }}
              >
                {HOUR_LABELS.map((h) => (
                  <div
                    key={h}
                    className="border-l border-[var(--border)] py-2 text-center text-[10px] font-medium text-[var(--text-secondary)] sm:text-xs"
                  >
                    {formatHourLabel(h)}
                  </div>
                ))}
              </div>
              <div className="border-l border-[var(--border)] px-2 py-2 text-center text-[10px] font-semibold text-[var(--text-secondary)]">
                Total
              </div>
            </div>

            {rows.map((row, idx) => {
              const cell = row.empId ? rosterMap[cellKey(row.empId, focusDate)] : null;
              const isWorking = cell?.status === 'W' && cell?.shift_start && cell?.shift_end;
              const bar = isWorking ? shiftBarPercent(cell.shift_start, cell.shift_end) : null;
              const isLocked = cell?.status === 'LEAVE' || cell?.status === 'H' || cell?.status === 'PH';

              return (
                <div
                  key={row.rowId}
                  className={cn(
                    'roster-timeline-grid border-b border-[var(--border)]',
                    idx % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]/40'
                  )}
                >
                  <div className="flex items-center gap-2 border-r border-[var(--border)] p-2">
                    <User className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                    <select
                      className="w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
                      value={row.empId || ''}
                      onChange={(e) => setRowEmployee(row.rowId, e.target.value)}
                    >
                      <option value="">(Select staff)</option>
                      {allEmployees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.emp_code} — {e.emp_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    className="relative min-h-[56px] min-w-0 cursor-pointer"
                    onClick={(e) => row.empId && !isLocked && handleTrackClick(e, row.empId)}
                    role="presentation"
                  >
                    <div
                      className="absolute inset-0 grid"
                      style={{ gridTemplateColumns: `repeat(${HOUR_LABELS.length}, minmax(44px, 1fr))` }}
                    >
                      {HOUR_LABELS.map((h) => (
                        <div key={h} className="h-full border-l border-[var(--border)]/50" />
                      ))}
                    </div>
                    {isLocked && (
                      <button
                        type="button"
                        className="absolute inset-y-2 left-1 right-1 z-10 flex items-center justify-center rounded-md bg-violet-500/20 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(row.empId, focusDate, cell);
                        }}
                      >
                        {cell.status === 'LEAVE' ? 'Leave' : 'PH'}
                      </button>
                    )}
                    {bar && !isLocked && (
                      <button
                        type="button"
                        className="roster-timeline-shift-bar absolute inset-y-2 z-10 flex items-center justify-center overflow-hidden rounded-md px-1 text-[10px] font-semibold text-white shadow-lg sm:text-xs"
                        style={{ left: bar.left, width: bar.width, minWidth: '56px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(row.empId, focusDate, cell);
                        }}
                      >
                        {formatTime12(cell.shift_start)} – {formatTime12(cell.shift_end)}
                      </button>
                    )}
                    {cell?.status === 'WO' && row.empId && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-medium text-amber-500/90">
                        Weekly off
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center border-l border-[var(--border)] font-mono text-sm font-semibold text-[var(--accent-primary)]">
                    {row.empId ? rowTotalHours(row.empId) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border border-t-0 border-[var(--border)] bg-[var(--bg-primary)] p-3 sm:p-4">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-secondary)]">
                <th className="p-2">Staff</th>
                <th className="p-2">Status</th>
                <th className="p-2">Schedule</th>
                <th className="p-2">Hours</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const emp = row.empId ? getEmployee(row.empId) : null;
                const cell = row.empId ? rosterMap[cellKey(row.empId, focusDate)] : null;
                return (
                  <tr key={row.rowId} className="border-t border-[var(--border)]">
                    <td className="p-2">
                      <select
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs"
                        value={row.empId || ''}
                        onChange={(e) => setRowEmployee(row.rowId, e.target.value)}
                      >
                        <option value="">(Select staff)</option>
                        {allEmployees.map((e) => (
                          <option key={e.id} value={e.id}>{e.emp_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">{cell?.status || '—'}</td>
                    <td className="p-2 font-mono text-xs">
                      {cell?.status === 'W' && cell.shift_start
                        ? `${formatTime12(cell.shift_start)} – ${formatTime12(cell.shift_end)}`
                        : '—'}
                    </td>
                    <td className="p-2 font-mono">{row.empId ? rowTotalHours(row.empId) : '—'}</td>
                    <td className="p-2">
                      {row.empId && (
                        <Button type="button" variant="ghost" className="text-xs" onClick={() => openEdit(row.empId, focusDate, cell)}>
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <ShiftEditModal
        open={modal.open}
        persistOnSave={false}
        onClose={() => setModal({ open: false, employee: null, date: null, cell: null })}
        employee={modal.employee}
        date={modal.date}
        cell={modal.cell}
        onSaved={(savedCell) => {
          if (savedCell && modal.employee && modal.date) {
            applyCellLocal(modal.employee.id, modal.date, savedCell);
          }
        }}
      />
    </div>
  );
}
