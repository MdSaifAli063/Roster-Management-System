import { useEffect, useState } from 'react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { ROLES, isEmployer } from '../lib/auth';
import { Check, X } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const STATUS_STYLE = {
  PENDING: 'bg-amber-500/20 text-amber-300 ring-amber-500/30',
  APPROVED: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
  REJECTED: 'bg-red-500/20 text-red-300 ring-red-500/30',
};

export default function Leave() {
  const { user } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const canReview = isEmployer(user?.role);
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [myEmpId, setMyEmpId] = useState('');
  const [form, setForm] = useState({
    emp_id: '',
    start_date: '',
    end_date: '',
    leave_type: 'ANNUAL',
    notes: '',
  });
  const [balances, setBalances] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get('/leave').then((r) => setRequests(r.data));

  useEffect(() => {
    load();
    if (isEmployee) {
      api.get('/dashboard/employee').then((r) => {
        if (r.data.linked && r.data.employee) {
          const id = String(r.data.employee.id);
          setMyEmpId(id);
          setForm((f) => ({ ...f, emp_id: id }));
          api.get('/leave/balances', { params: { emp_id: id } }).then((b) => setBalances(b.data));
        }
      });
    } else {
      api.get('/employees').then((r) => setEmployees(r.data));
    }
  }, [isEmployee]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) {
      toast?.error?.('Select start and end dates') || alert('Select dates');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/leave', {
        emp_id: Number(form.emp_id || myEmpId),
        start_date: form.start_date,
        end_date: form.end_date,
        leave_type: form.leave_type,
        notes: form.notes,
      });
      setForm((f) => ({
        ...f,
        start_date: '',
        end_date: '',
        notes: '',
      }));
      toast?.success?.('Leave request submitted') || alert('Submitted');
      load();
      if (myEmpId) {
        api.get('/leave/balances', { params: { emp_id: myEmpId } }).then((b) => setBalances(b.data));
      }
    } catch (err) {
      toast?.error?.(err.response?.data?.error || 'Submit failed') || alert(err.response?.data?.error || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const review = async (id, action) => {
    await api.put(`/leave/${id}/${action}`);
    load();
  };

  return (
    <PageShell
      subtitle={
        isEmployee
          ? 'Request time off — approved days appear as Leave on your roster'
          : 'Review and approve employee leave requests'
      }
    >

      {isEmployee && (
        <Card title="Leave balance">
          {balances ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Annual leave</p>
                <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">{balances.annual} days</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Sick leave</p>
                <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">{balances.sick} days</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Balance unavailable — contact HR if your profile is not linked.</p>
          )}
        </Card>
      )}

      {isEmployee && (
        <Card title="Apply for leave">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Leave type"
              value={form.leave_type}
              onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            >
              <option value="ANNUAL">Annual leave</option>
              <option value="SICK">Sick leave</option>
              <option value="UNPAID">Unpaid leave</option>
            </Select>
            <div className="hidden sm:block" />
            <Input
              label="Date from"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />
            <Input
              label="Date to"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              required
            />
            <Input
              label="Reason"
              className="sm:col-span-2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Brief reason for your request"
            />
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" disabled={submitting || !myEmpId}>
                {submitting ? 'Submitting…' : 'Submit leave request'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {canReview && !isEmployee && (
        <Card title="Submit leave for an employee">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await api.post('/leave', { ...form, emp_id: Number(form.emp_id) });
              load();
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Select label="Employee" value={form.emp_id} onChange={(e) => setForm({ ...form, emp_id: e.target.value })} required>
              <option value="">Select</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.emp_code} — {emp.emp_name}</option>
              ))}
            </Select>
            <Select label="Leave type" value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
              <option value="ANNUAL">Annual</option>
              <option value="SICK">Sick</option>
              <option value="UNPAID">Unpaid</option>
            </Select>
            <Input label="Start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            <Input label="End" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
            <Input label="Notes" className="sm:col-span-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Button type="submit" variant="teal">Submit</Button>
          </form>
        </Card>
      )}

      <Card title={isEmployee ? 'My leave history' : 'Pending & recent requests'}>
        {requests.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-secondary)]">
            {isEmployee ? 'No leave requests yet.' : 'No leave requests.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                  {!isEmployee && <th className="p-2">Employee</th>}
                  <th className="p-2">Type</th>
                  <th className="p-2">Dates</th>
                  <th className="p-2">Reason</th>
                  <th className="p-2">Status</th>
                  {canReview && <th className="p-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)]">
                    {!isEmployee && (
                      <td className="p-2 text-[var(--text-primary)]">{r.emp_code} — {r.emp_name}</td>
                    )}
                    <td className="p-2">{r.leave_type}</td>
                    <td className="p-2 whitespace-nowrap">
                      {String(r.start_date).slice(0, 10)} – {String(r.end_date).slice(0, 10)}
                    </td>
                    <td className="p-2 max-w-[200px] truncate text-[var(--text-secondary)]" title={r.notes}>
                      {r.notes || '—'}
                    </td>
                    <td className="p-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[r.status] || ''}`}>
                        {r.status}
                      </span>
                      {r.status === 'APPROVED' && isEmployee && (
                        <span className="ml-2 text-[10px] text-violet-400">On roster as Leave</span>
                      )}
                    </td>
                    {canReview && (
                      <td className="p-2">
                        {r.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <button type="button" onClick={() => review(r.id, 'approve')} className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10" title="Approve">
                              <Check className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => review(r.id, 'reject')} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10" title="Reject">
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
          </div>
        )}
      </Card>
    </PageShell>
  );
}
