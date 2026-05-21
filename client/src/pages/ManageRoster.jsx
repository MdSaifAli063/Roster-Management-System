import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import EmployeeFilterForm, { buildQuery } from '../components/EmployeeFilterForm';

export default function ManageRoster() {
  const navigate = useNavigate();
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
      setEmployees(await api.get('/employees', { params: buildQuery(filters) }).then((r) => r.data));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not load previous roster');
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const startBlank = async () => {
    setCreateMode('blank');
    setStep(1);
  };

  const applyPreviousTemplate = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rosters/previous-period', { params: { plant_id: filters.plant_id } });
      for (const e of data.entries || []) {
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
      alert('Previous roster copied — edit cells in View Roster');
      navigate('/view-roster', { state: { startDate, endDate } });
    } catch (err) {
      alert(err.response?.data?.error || 'Copy failed');
    } finally {
      setLoading(false);
    }
  };

  const generate = async (andView) => {
    if (!selected.size || !startDate || !endDate || !patternId) {
      alert('Select employees, dates, and shift pattern');
      return;
    }
    setLoading(true);
    try {
      await api.post('/rosters/generate', {
        emp_ids: [...selected],
        start_date: startDate,
        end_date: endDate,
        shift_pattern_id: Number(patternId),
      });
      if (andView) {
        navigate('/view-roster', {
          state: { empIds: [...selected], startDate, endDate },
        });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Create Roster</h1>

      {step === 0 && (
        <Card title="How do you want to start?">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-xl border border-[var(--border)] p-6 text-left transition hover:border-[var(--accent-primary)]"
              onClick={loadFromPrevious}
              disabled={loading}
            >
              <p className="font-semibold text-[var(--text-primary)]">Create from Previous Roster</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Load last period as an editable template</p>
            </button>
            <button
              type="button"
              className="rounded-xl border border-[var(--border)] p-6 text-left transition hover:border-[var(--accent-primary)]"
              onClick={startBlank}
            >
              <p className="font-semibold text-[var(--text-primary)]">Start Blank</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Empty grid — pick employees and dates</p>
            </button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Step 1 — Employee Roster Search">
          <EmployeeFilterForm
            filters={filters}
            onChange={setFilters}
            onSubmit={searchEmployees}
            submitLabel={loading ? 'Searching…' : 'Submit'}
          />
        </Card>
      )}

      {step === 2 && (
        <Card title="Step 2 — Select Employees">
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <Input label="Roster Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="Roster End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Select label="Applicable Shift Pattern" value={patternId} onChange={(e) => setPatternId(e.target.value)}>
              <option value="">Select pattern</option>
              {patterns.map((p) => (
                <option key={p.id} value={p.id}>{p.pattern_name}</option>
              ))}
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">
                    <input type="checkbox" checked={selected.size === employees.length} onChange={(e) => toggleAll(e.target.checked)} />
                  </th>
                  <th className="p-2">Emp Code</th>
                  <th className="p-2">Emp Name</th>
                  <th className="p-2">Process</th>
                  <th className="p-2">Grade</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Shift Pattern</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-2"><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleOne(e.id)} /></td>
                    <td className="p-2 font-mono">{e.emp_code}</td>
                    <td className="p-2">{e.emp_name}</td>
                    <td className="p-2">{e.process}</td>
                    <td className="p-2">{e.grade}</td>
                    <td className="p-2">{e.role}</td>
                    <td className="p-2">{e.pattern_name || e.current_shift_pattern}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setStep(createMode === 'blank' ? 1 : 0)}>Back</Button>
            {createMode === 'previous' && (
              <Button variant="secondary" disabled={loading} onClick={applyPreviousTemplate}>Copy previous cells</Button>
            )}
            <Button variant="teal" disabled={loading} onClick={() => generate(true)}>Submit and View Roster</Button>
            <Button variant="primary" disabled={loading} onClick={() => generate(false)}>Submit and Exit</Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>Exit without Saving</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
