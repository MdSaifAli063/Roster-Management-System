import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: '',
    tax_id: '',
    country_code: 'AU',
    state_code: '',
    location_name: '',
    timezone: 'Australia/Sydney',
    operating_days: Object.fromEntries(DAYS.map((d) => [d, { open: d !== 'sat' && d !== 'sun', start: '09:00', end: '17:00' }])),
    min_employee_age: 18,
    employment_types: ['FULL_TIME', 'PART_TIME', 'CASUAL'],
    pay_rules: { overtime_after_hours: 38, break_required: true },
    employees: [{ emp_code: 'EMP001', emp_name: '', email: '' }],
    holidays: [],
  });

  const saveStep = async (finalize = false) => {
    setSaving(true);
    try {
      await api.post('/business/onboarding', { ...form, step, finalize });
      if (finalize) navigate('/dashboard');
      else setStep((s) => s + 1);
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const loadHolidays = async () => {
    const year = new Date().getFullYear();
    const { data } = await api.get('/holidays/fetch-public', {
      params: { country: form.country_code, year },
    });
    setForm((f) => ({ ...f, holidays: data }));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Set up your business</h1>
      <p className="text-sm text-[var(--text-secondary)]">Step {step} of 5</p>

      {step === 1 && (
        <Card title="Business details">
          <div className="space-y-3">
            <Input label="Business name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
            <Input label="ABN / Tax ID" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
            <Input label="Country (ISO)" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} />
            <Input label="State / Region" value={form.state_code} onChange={(e) => setForm({ ...form, state_code: e.target.value })} />
            <Input label="Location / Place name" value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} />
          </div>
          <Button className="mt-4" variant="primary" onClick={() => saveStep(false)} disabled={saving}>Next</Button>
        </Card>
      )}

      {step === 2 && (
        <Card title="Operating hours">
          <Input label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          <div className="mt-4 space-y-2">
            {DAYS.map((d) => (
              <div key={d} className="flex flex-wrap items-center gap-2 rounded border border-[var(--border)] p-2">
                <label className="flex w-24 items-center gap-2 text-sm capitalize">
                  <input
                    type="checkbox"
                    checked={form.operating_days[d]?.open}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        operating_days: {
                          ...form.operating_days,
                          [d]: { ...form.operating_days[d], open: e.target.checked },
                        },
                      })
                    }
                  />
                  {d}
                </label>
                <input type="time" step="900" className="rounded border px-2 py-1 text-sm" value={form.operating_days[d]?.start || '09:00'} onChange={(e) => setForm({ ...form, operating_days: { ...form.operating_days, [d]: { ...form.operating_days[d], start: e.target.value } } })} />
                <span>–</span>
                <input type="time" step="900" className="rounded border px-2 py-1 text-sm" value={form.operating_days[d]?.end || '17:00'} onChange={(e) => setForm({ ...form, operating_days: { ...form.operating_days, [d]: { ...form.operating_days[d], end: e.target.value } } })} />
              </div>
            ))}
          </div>
          <Button className="mt-4" variant="primary" onClick={() => saveStep(false)} disabled={saving}>Next</Button>
        </Card>
      )}

      {step === 3 && (
        <Card title="Employment rules">
          <Input label="Minimum employee age" type="number" value={form.min_employee_age} onChange={(e) => setForm({ ...form, min_employee_age: Number(e.target.value) })} />
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Types: Full-time, Part-time, Casual (configured in pay rules JSON)</p>
          <Button className="mt-4" variant="primary" onClick={() => saveStep(false)} disabled={saving}>Next</Button>
        </Card>
      )}

      {step === 4 && (
        <Card title="Add employees">
          {form.employees.map((emp, i) => (
            <div key={i} className="mb-3 grid gap-2 sm:grid-cols-3">
              <Input placeholder="Code" value={emp.emp_code} onChange={(e) => { const em = [...form.employees]; em[i].emp_code = e.target.value; setForm({ ...form, employees: em }); }} />
              <Input placeholder="Name" value={emp.emp_name} onChange={(e) => { const em = [...form.employees]; em[i].emp_name = e.target.value; setForm({ ...form, employees: em }); }} />
              <Input placeholder="Email" value={emp.email} onChange={(e) => { const em = [...form.employees]; em[i].email = e.target.value; setForm({ ...form, employees: em }); }} />
            </div>
          ))}
          <Button variant="secondary" onClick={() => setForm({ ...form, employees: [...form.employees, { emp_code: `EMP${form.employees.length + 1}`, emp_name: '', email: '' }] })}>+ Add row</Button>
          <Button className="mt-4" variant="primary" onClick={() => saveStep(false)} disabled={saving}>Next</Button>
        </Card>
      )}

      {step === 5 && (
        <Card title="Holidays">
          <Button variant="secondary" onClick={loadHolidays}>Import public holidays ({form.country_code})</Button>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{form.holidays.length} holidays loaded</p>
          <Button className="mt-4" variant="primary" onClick={() => saveStep(true)} disabled={saving}>Finish setup</Button>
        </Card>
      )}
    </div>
  );
}
