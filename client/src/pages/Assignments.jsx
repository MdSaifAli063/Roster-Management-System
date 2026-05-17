import { useEffect, useState } from 'react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ from_emp_id: '', to_emp_id: '', assignment_date: '', reason: 'LEAVE', notes: '' });

  const load = () => api.get('/assignments').then((r) => setAssignments(r.data));
  useEffect(() => {
    load();
    api.get('/employees').then((r) => setEmployees(r.data));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/assignments', {
      ...form,
      from_emp_id: Number(form.from_emp_id),
      to_emp_id: Number(form.to_emp_id),
    });
    setForm({ from_emp_id: '', to_emp_id: '', assignment_date: '', reason: 'LEAVE', notes: '' });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Work Reassignment</h1>

      <Card title="Assign Coverage">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Select label="From Employee" value={form.from_emp_id} onChange={(e) => setForm({ ...form, from_emp_id: e.target.value })} required>
            <option value="">Select</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.emp_code} — {e.emp_name}</option>)}
          </Select>
          <Select label="To Employee" value={form.to_emp_id} onChange={(e) => setForm({ ...form, to_emp_id: e.target.value })} required>
            <option value="">Select</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.emp_code} — {e.emp_name}</option>)}
          </Select>
          <Input label="Date" type="date" value={form.assignment_date} onChange={(e) => setForm({ ...form, assignment_date: e.target.value })} required />
          <Select label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
            <option value="LEAVE">Leave</option>
            <option value="SICK">Sick</option>
            <option value="OTHER">Other</option>
          </Select>
          <Input label="Notes" className="sm:col-span-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" variant="teal">Submit</Button>
        </form>
      </Card>

      <Card title="History">
        <table className="min-w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="p-2">Date</th><th className="p-2">From</th><th className="p-2">To</th><th className="p-2">Reason</th><th className="p-2">Notes</th></tr></thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b dark:border-slate-800">
                <td className="p-2">{a.assignment_date?.slice?.(0, 10)}</td>
                <td className="p-2">{a.from_code} — {a.from_name}</td>
                <td className="p-2">{a.to_code} — {a.to_name}</td>
                <td className="p-2">{a.reason}</td>
                <td className="p-2 text-slate-500">{a.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
