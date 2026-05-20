import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/PageHeader';
import GradeBadge from '../components/GradeBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Input, Select } from '../components/ui/Input';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Employees() {
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [plants, setPlants] = useState([]);
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/employees').then((r) => setEmployees(r.data));
  useEffect(() => {
    setLoading(true);
    Promise.all([load(), api.get('/plants').then((r) => setPlants(r.data))]).finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(
    (e) => !search || e.emp_code.includes(search) || e.emp_name.toLowerCase().includes(search.toLowerCase())
  );

  const save = async (e) => {
    e.preventDefault();
    if (form.id) await api.put(`/employees/${form.id}`, form);
    else await api.post('/employees', form);
    setForm(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete employee?')) return;
    await api.delete(`/employees/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        pathname={location.pathname}
        subtitle={`${filtered.length} employees`}
        actions={
          <Button variant="primary" onClick={() => setForm({ emp_code: '', emp_name: '', email: '', grade: '', role: '', function: '', plant_id: '' })}>
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        }
      />

      <Card>
        <Input label="Search" placeholder="Code or name…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-xs" />
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-[var(--border)] bg-[var(--bg-elevated)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Function</th>
                <th className="p-3">Role</th><th className="p-3">Grade</th><th className="p-3">Location</th><th className="p-3">Shift</th><th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr
                  key={e.id}
                  className={cn(
                    'border-b border-[var(--border)] transition-colors hover:bg-blue-500/[0.04] stagger-row',
                    i % 2 === 1 && 'bg-white/[0.02]'
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <td className="p-3 font-mono text-xs text-[var(--text-secondary)]">{e.emp_code}</td>
                  <td className="p-3 font-medium text-[var(--text-primary)]">{e.emp_name}</td>
                  <td className="p-3 text-[var(--text-secondary)]">{e.function}</td>
                  <td className="max-w-[120px] truncate p-3 text-[var(--text-secondary)]" title={e.role}>{e.role}</td>
                  <td className="p-3"><GradeBadge grade={e.grade} /></td>
                  <td className="p-3 text-[var(--text-secondary)]">{e.plant_location}</td>
                  <td className="p-3">
                    {e.current_shift_pattern ? (
                      <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-300">{e.current_shift_pattern}</span>
                    ) : '—'}
                  </td>
                  <td className="p-3">
                    <button type="button" onClick={() => setForm({ ...e })} className="rounded p-1.5 text-blue-400 hover:bg-blue-500/10"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => remove(e.id)} className="rounded p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-scale-in glass-card w-full max-w-lg">
          <Card title={form.id ? 'Edit Employee' : 'New Employee'} glass={false} className="border-0 bg-transparent shadow-none">
            <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
              <Input label="Emp Code" value={form.emp_code} onChange={(e) => setForm({ ...form, emp_code: e.target.value })} required />
              <Input label="Emp Name" value={form.emp_name} onChange={(e) => setForm({ ...form, emp_name: e.target.value })} required />
              <Input label="Email" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Function" value={form.function || ''} onChange={(e) => setForm({ ...form, function: e.target.value })} />
              <Input label="Role" value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              <Input label="Grade" value={form.grade || ''} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
              <Select label="Plant" value={form.plant_id || ''} onChange={(e) => setForm({ ...form, plant_id: e.target.value })}>
                <option value="">—</option>
                {plants.map((p) => <option key={p.id} value={p.id}>{p.plant_name}</option>)}
              </Select>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" variant="primary">Save</Button>
                <Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
              </div>
            </form>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}
