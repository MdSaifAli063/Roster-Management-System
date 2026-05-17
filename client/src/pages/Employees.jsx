import { useEffect, useState } from 'react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [plants, setPlants] = useState([]);
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => api.get('/employees').then((r) => setEmployees(r.data));
  useEffect(() => {
    load();
    api.get('/plants').then((r) => setPlants(r.data));
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Employees</h1>
        <Button variant="teal" onClick={() => setForm({ emp_code: '', emp_name: '', email: '', grade: '', role: '', function: '', plant_id: '' })}>
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <Card>
        <Input label="Search" placeholder="Code or name…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-xs" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="p-2">Code</th><th className="p-2">Name</th><th className="p-2">Function</th>
                <th className="p-2">Role</th><th className="p-2">Grade</th><th className="p-2">Location</th><th className="p-2">Shift</th><th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-2 font-mono">{e.emp_code}</td>
                  <td className="p-2">{e.emp_name}</td>
                  <td className="p-2">{e.function}</td>
                  <td className="p-2">{e.role}</td>
                  <td className="p-2">{e.grade}</td>
                  <td className="p-2">{e.plant_location}</td>
                  <td className="p-2">{e.current_shift_pattern}</td>
                  <td className="p-2">
                    <button type="button" onClick={() => setForm({ ...e })} className="p-1 text-teal"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => remove(e.id)} className="p-1 text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card title={form.id ? 'Edit Employee' : 'New Employee'} className="w-full max-w-lg">
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
                <Button type="submit" variant="teal">Save</Button>
                <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
