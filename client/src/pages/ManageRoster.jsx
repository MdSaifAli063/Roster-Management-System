import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import EmployeeFilterForm, { buildQuery } from '../components/EmployeeFilterForm';
import RosterTimelineEditor from '../components/RosterTimelineEditor';
import PageHeader from '../components/PageHeader';

export default function ManageRoster() {
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [createMode, setCreateMode] = useState(null);
  const [filters, setFilters] = useState({});
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [patternId, setPatternId] = useState('');
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editorEmployees, setEditorEmployees] = useState([]);

  const searchEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employees', { params: buildQuery(filters) });
      setEmployees(data);
      setSelected(new Set(data.map((e) => e.id)));
      setStep(2);
      const p = await api.get('/shifts/patterns');
      setPatterns(p.data);
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (checked) => {
    setSelected(checked ? new Set(employees.map((e) => e.id)) : new Set());
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const loadFromPrevious = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rosters/previous-period', { params: { plant_id: filters.plant_id || undefined } });
      if (!data.entries?.length) {
        alert('No previous roster found. Use Start Blank or generate a roster first.');
        setStep(0);
        return;
      }
      const dates = data.entries.map((e) => e.roster_date?.slice?.(0, 10) || e.roster_date);
      setStartDate(dates.sort()[0]);
      setEndDate(dates.sort().slice(-1)[0]);
      setSelected(new Set(data.entries.map((e) => e.emp_id)));
      setCreateMode('previous');
      setStep(2);
      const p = await api.get('/shifts/patterns');
      setPatterns(p.data);
      const { data: emps } = await api.get('/employees', { params: buildQuery(filters) });
      setEmployees(emps);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not load previous roster');
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const startBlank = () => {
    setCreateMode('blank');
    setStep(1);
  };

  const openEditor = async () => {
    if (!selected.size || !startDate || !endDate) {
      alert('Select employees and roster dates');
      return;
    }
    setLoading(true);
    try {
      const selectedList = employees.filter((e) => selected.has(e.id));

      if (createMode === 'previous') {
        const { data } = await api.get('/rosters/previous-period', { params: { plant_id: filters.plant_id } });
        for (const e of data.entries || []) {
          if (!selected.has(e.emp_id)) continue;
          await api.put(`/rosters/cell/${e.emp_id}/${e.roster_date?.slice?.(0, 10) || e.roster_date}`, {
            status: e.status,
            shift_id: e.shift_id,
            shift_start: e.shift_start,
            shift_end: e.shift_end,
            mandatory_start: e.mandatory_start,
            mandatory_end: e.mandatory_end,
            break_minutes: e.break_minutes || 0,
          });
        }
      } else if (patternId) {
        await api.post('/rosters/generate', {
          emp_ids: [...selected],
          start_date: startDate,
          end_date: endDate,
          shift_pattern_id: Number(patternId),
        });
      }

      setEditorEmployees(selectedList);
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not open roster editor');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="space-y-4">
        <PageHeader pathname={location.pathname} subtitle={`${startDate} → ${endDate} · timeline editor`} />
        <RosterTimelineEditor
          startDate={startDate}
          endDate={endDate}
          plantId={filters.plant_id}
          initialEmployees={editorEmployees}
          onExit={() => setStep(2)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        pathname={location.pathname}
        subtitle={step === 0 ? 'Start from a previous period or a blank roster' : 'Configure period and staff, then open the timeline editor'}
      />

      {step === 0 && (
        <Card title="How do you want to start?">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-xl border border-[var(--border)] p-6 text-left transition hover:border-[var(--accent-primary)] hover:shadow-lg hover:shadow-blue-500/10"
              onClick={loadFromPrevious}
              disabled={loading}
            >
              <p className="font-semibold text-[var(--text-primary)]">Create from Previous Roster</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Load last period as an editable template</p>
            </button>
            <button
              type="button"
              className="rounded-xl border border-[var(--border)] p-6 text-left transition hover:border-[var(--accent-primary)] hover:shadow-lg hover:shadow-blue-500/10"
              onClick={startBlank}
            >
              <p className="font-semibold text-[var(--text-primary)]">Start Blank</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Pick staff and dates, then edit on the timeline grid</p>
            </button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Step 1 — Find employees">
          <EmployeeFilterForm
            filters={filters}
            onChange={setFilters}
            onSubmit={searchEmployees}
            submitLabel={loading ? 'Searching…' : 'Continue'}
          />
          <Button className="mt-4" variant="ghost" onClick={() => setStep(0)}>Back</Button>
        </Card>
      )}

      {step === 2 && (
        <Card title="Step 2 — Period & staff">
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <Input label="Roster start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="Roster end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Select label="Shift pattern (optional)" value={patternId} onChange={(e) => setPatternId(e.target.value)}>
              <option value="">None — edit manually on timeline</option>
              {patterns.map((p) => (
                <option key={p.id} value={p.id}>{p.pattern_name}</option>
              ))}
            </Select>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)] text-left text-[var(--text-secondary)]">
                  <th className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.size === employees.length && employees.length > 0}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th className="p-2">Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--border)]">
                    <td className="p-2">
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleOne(e.id)} />
                    </td>
                    <td className="p-2 font-mono text-xs">{e.emp_code}</td>
                    <td className="p-2">{e.emp_name}</td>
                    <td className="p-2 text-[var(--text-secondary)]">{e.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setStep(createMode === 'blank' ? 1 : 0)}>Back</Button>
            <Button variant="primary" disabled={loading} onClick={openEditor} className="btn-glow">
              {loading ? 'Preparing…' : 'Open timeline editor'}
            </Button>
          </div>
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            The editor shows an hourly grid (5am–10pm), day tabs, shift bars, hours &amp; cost totals — matching your roster workflow.
          </p>
        </Card>
      )}
    </div>
  );
}
