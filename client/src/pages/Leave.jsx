import { useEffect, useState } from 'react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { Check, X } from 'lucide-react';

export default function Leave() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    emp_id: '',
    start_date: '',
    end_date: '',
    leave_type: 'ANNUAL',
    notes: '',
  });
  const canReview = user?.role === 'ADMIN' || user?.role === 'HR_USER';

  const load = () => api.get('/leave').then((r) => setRequests(r.data));
  useEffect(() => {
    load();
    api.get('/employees').then((r) => setEmployees(r.data));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/leave', { ...form, emp_id: Number(form.emp_id) });
    setForm({ emp_id: '', start_date: '', end_date: '', leave_type: 'ANNUAL', notes: '' });
    load();
  };

  const review = async (id, action) => {
    await api.put(`/leave/${id}/${action}`);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Leave</h1>

      <Card title="Submit leave request">
        <p className="mb-4 text-sm text-slate-500">HR is notified by email when a request is submitted.</p>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Select label="Employee" value={form.emp_id} onChange={(e) => setForm({ ...form, emp_id: e.target.value })} required>
            <option value="">Select</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.emp_code} — {e.emp_name}</option>
            ))}
          </Select>
          <Select label="Leave type" value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
            <option value="ANNUAL">Annual</option>
            <option value="SICK">Sick</option>
            <option value="UNPAID">Unpaid</option>
            <option value="OTHER">Other</option>
          </Select>
          <Input label="Start date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
          <Input label="End date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
          <Input label="Notes" className="sm:col-span-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" variant="teal">Submit request</Button>
        </form>
      </Card>

      <Card title="Leave requests">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="p-2">Employee</th>
              <th className="p-2">Type</th>
              <th className="p-2">Dates</th>
              <th className="p-2">Status</th>
              {canReview && <th className="p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b dark:border-slate-800">
                <td className="p-2">{r.emp_code} — {r.emp_name}</td>
                <td className="p-2">{r.leave_type}</td>
                <td className="p-2">{String(r.start_date).slice(0, 10)} – {String(r.end_date).slice(0, 10)}</td>
                <td className="p-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    r.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    r.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {r.status}
                  </span>
                </td>
                {canReview && (
                  <td className="p-2">
                    {r.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button type="button" onClick={() => review(r.id, 'approve')} className="rounded p-1 text-green-600 hover:bg-green-50" title="Approve">
                          <Check className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => review(r.id, 'reject')} className="rounded p-1 text-red-600 hover:bg-red-50" title="Reject">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
