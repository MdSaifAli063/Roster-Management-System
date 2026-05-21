import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

export default function StaffDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: d } = await api.get(`/staff/${id}`);
    setData(d);
    setForm(d.employee);
  };

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/staff/${id}`, form);
      setEditing(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <p className="text-[var(--text-secondary)]">Loading…</p>;
  const e = editing ? form : data.employee;

  return (
    <div className="space-y-6">
      <Link to="/staff" className="text-sm text-[var(--accent-primary)]">← Back to staff</Link>
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">{data.employee.emp_name}</h1>

      <Card title="Profile">
        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Name" value={e.emp_name || ''} onChange={(ev) => setForm({ ...form, emp_name: ev.target.value })} />
            <Input label="Email" value={e.email || ''} onChange={(ev) => setForm({ ...form, email: ev.target.value })} />
            <Select label="Type" value={e.employment_type || ''} onChange={(ev) => setForm({ ...form, employment_type: ev.target.value })}>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CASUAL">Casual</option>
            </Select>
            <Input label="Hourly rate" type="number" value={e.hourly_rate || ''} onChange={(ev) => setForm({ ...form, hourly_rate: ev.target.value })} />
            <Input label="Annual leave balance" type="number" value={e.annual_leave_balance ?? ''} onChange={(ev) => setForm({ ...form, annual_leave_balance: ev.target.value })} />
            <Input label="Sick leave balance" type="number" value={e.sick_leave_balance ?? ''} onChange={(ev) => setForm({ ...form, sick_leave_balance: ev.target.value })} />
          </div>
        ) : (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-[var(--text-secondary)]">Code</dt><dd>{e.emp_code}</dd></div>
            <div><dt className="text-[var(--text-secondary)]">Email</dt><dd>{e.email || '—'}</dd></div>
            <div><dt className="text-[var(--text-secondary)]">Type</dt><dd>{e.employment_type || '—'}</dd></div>
            <div><dt className="text-[var(--text-secondary)]">Rate</dt><dd>{e.hourly_rate ? `$${e.hourly_rate}/hr` : '—'}</dd></div>
            <div><dt className="text-[var(--text-secondary)]">Annual leave</dt><dd>{data.leave_balances?.[0]?.balance_days ?? e.annual_leave_balance ?? '—'} days</dd></div>
            <div><dt className="text-[var(--text-secondary)]">Sick leave</dt><dd>{e.sick_leave_balance ?? '—'} days</dd></div>
          </dl>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button variant="primary" onClick={save} disabled={saving}>Save</Button>
              <Button variant="ghost" onClick={() => { setEditing(false); setForm(data.employee); }}>Cancel</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </Card>

      <Card title="Last 4 weeks roster">
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
          {(data.roster_history || []).map((r) => (
            <li key={r.id} className="flex justify-between border-b border-[var(--border)] py-1">
              <span>{r.roster_date?.slice?.(0, 10) || r.roster_date}</span>
              <span className="font-mono">{r.status} {r.total_hours ? `${r.total_hours}h` : ''}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
