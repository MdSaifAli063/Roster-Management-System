import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  MapPin,
  Clock,
  Palmtree,
  Calendar,
  CreditCard,
  Settings,
  ChevronRight,
  Save,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select, Toggle } from '../components/ui/Input';
import DashboardPanel from '../components/dashboard/DashboardPanel';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

const EMPLOYMENT_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'CONTRACT', label: 'Contract' },
];

const COUNTRIES = [
  { value: 'AU', label: 'Australia' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IN', label: 'India' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'SG', label: 'Singapore' },
];

const DEFAULT_OPERATING = Object.fromEntries(
  DAYS.map((d) => [d, { open: d !== 'sat' && d !== 'sun', start: '09:00', end: '17:00' }])
);

const QUICK_LINKS = [
  { to: '/staff', icon: Users, label: 'Staff directory' },
  { to: '/plants', icon: MapPin, label: 'Sites & plants' },
  { to: '/holidays', icon: Palmtree, label: 'Holiday calendar' },
  { to: '/manage-roster', icon: Calendar, label: 'Create roster' },
  { to: '/settings/billing', icon: CreditCard, label: 'Billing & plan' },
  { to: '/settings', icon: Settings, label: 'App settings' },
];

function planLabel(id) {
  if (!id) return 'Starter';
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export default function Organization() {
  const location = useLocation();
  const toast = useToast();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get('/business/organization')
      .then((res) => {
        setData(res.data);
        const b = res.data.business;
        setForm({
          business_name: b.business_name || '',
          tax_id: b.tax_id || '',
          country_code: b.country_code || 'AU',
          state_code: b.state_code || '',
          location_name: b.location_name || '',
          timezone: b.timezone || 'Australia/Sydney',
          operating_days:
            b.operating_days && Object.keys(b.operating_days).length
              ? b.operating_days
              : DEFAULT_OPERATING,
          min_employee_age: b.min_employee_age ?? 18,
          employment_types: Array.isArray(b.employment_types) ? b.employment_types : ['FULL_TIME', 'PART_TIME', 'CASUAL'],
          pay_rules: {
            overtime_after_hours: b.pay_rules?.overtime_after_hours ?? 38,
            break_required: b.pay_rules?.break_required !== false,
          },
          auto_approve_leave: !!res.data.settings?.auto_approve_leave,
        });
      })
      .catch(() => toast.error('Could not load organization'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form?.business_name?.trim()) {
      toast.error('Organization name is required');
      return;
    }
    setSaving(true);
    try {
      const { data: saved } = await api.patch('/business/organization', form);
      setData((prev) => ({
        ...prev,
        business: saved.business,
        settings: saved.settings,
      }));
      updateUser({ businessName: saved.business.business_name });
      toast.success('Organization saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleEmploymentType = (value) => {
    setForm((f) => {
      const types = f.employment_types.includes(value)
        ? f.employment_types.filter((t) => t !== value)
        : [...f.employment_types, value];
      return { ...f, employment_types: types.length ? types : [value] };
    });
  };

  if (loading || !form) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <PageHeader pathname={location.pathname} subtitle="Loading organization…" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const sub = data?.subscription || {};

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <PageHeader
        pathname={location.pathname}
        subtitle="Manage your company profile, locations, roster rules, and workforce policies."
        actions={
          <Button variant="primary" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      <DashboardPanel className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
          <Building2 className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">{form.business_name}</h2>
          <p className="text-sm text-slate-500">
            {form.location_name || 'No primary location set'}
            {form.country_code ? ` · ${form.country_code}` : ''}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Owner: {data?.owner?.name} ({data?.owner?.email}) · Plan: {planLabel(sub.effectivePlanId)}
            {sub.trialActive && sub.trialDaysLeft != null ? ` · Trial: ${sub.trialDaysLeft} days left` : ''}
          </p>
        </div>
      </DashboardPanel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Employees', value: stats.employees, icon: Users },
          { label: 'Sites', value: stats.plants, icon: MapPin },
          { label: 'Shifts', value: stats.shifts, icon: Clock },
          { label: 'Leave pending', value: stats.pendingLeave, icon: Palmtree },
        ].map(({ label, value, icon: Icon }) => (
          <DashboardPanel key={label} className="!p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
              </div>
              <Icon className="h-5 w-5 text-blue-500 opacity-80" />
            </div>
          </DashboardPanel>
        ))}
      </div>

      <Card title="Company profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Organization name"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            required
          />
          <Input
            label="Tax ID / ABN"
            value={form.tax_id}
            onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
            placeholder="e.g. 12 345 678 901"
          />
          <Input
            label="Primary location name"
            value={form.location_name}
            onChange={(e) => setForm({ ...form, location_name: e.target.value })}
            placeholder="Head office, store name, etc."
            className="sm:col-span-2"
          />
        </div>
      </Card>

      <Card title="Region & timezone">
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Used for public holidays, roster dates, and attendance timestamps.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Country"
            value={form.country_code}
            onChange={(e) => setForm({ ...form, country_code: e.target.value })}
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Input
            label="State / region"
            value={form.state_code}
            onChange={(e) => setForm({ ...form, state_code: e.target.value })}
            placeholder="e.g. NSW, CA"
          />
          <Input
            label="Timezone"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="sm:col-span-2"
            placeholder="Australia/Sydney"
          />
        </div>
      </Card>

      <Card title="Operating hours">
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Default working windows for roster planning and attendance expectations.
        </p>
        <div className="space-y-2">
          {DAYS.map((d) => (
            <div
              key={d}
              className="flex flex-col gap-2 rounded-xl border border-[var(--border)] p-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <label className="flex w-full items-center gap-2 text-sm font-medium capitalize sm:w-28">
                <input
                  type="checkbox"
                  checked={!!form.operating_days[d]?.open}
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
                {DAY_LABELS[d]}
              </label>
              <input
                type="time"
                className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm"
                disabled={!form.operating_days[d]?.open}
                value={form.operating_days[d]?.start || '09:00'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    operating_days: {
                      ...form.operating_days,
                      [d]: { ...form.operating_days[d], start: e.target.value },
                    },
                  })
                }
              />
              <span className="hidden text-slate-400 sm:inline">–</span>
              <input
                type="time"
                className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm"
                disabled={!form.operating_days[d]?.open}
                value={form.operating_days[d]?.end || '17:00'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    operating_days: {
                      ...form.operating_days,
                      [d]: { ...form.operating_days[d], end: e.target.value },
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Workforce rules">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Minimum employee age"
            type="number"
            min={14}
            max={99}
            value={form.min_employee_age}
            onChange={(e) => setForm({ ...form, min_employee_age: Number(e.target.value) })}
          />
          <Input
            label="Overtime after (hours / week)"
            type="number"
            min={1}
            max={80}
            value={form.pay_rules.overtime_after_hours}
            onChange={(e) =>
              setForm({
                ...form,
                pay_rules: { ...form.pay_rules, overtime_after_hours: Number(e.target.value) },
              })
            }
          />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Employment types</p>
          <div className="flex flex-wrap gap-3">
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.employment_types.includes(opt.value)}
                  onChange={() => toggleEmploymentType(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Toggle
            label="Require break tracking in pay rules"
            checked={form.pay_rules.break_required}
            onChange={(val) => setForm({ ...form, pay_rules: { ...form.pay_rules, break_required: val } })}
          />
        </div>
      </Card>

      <Card title="Organization policies">
        <Toggle
          label="Auto-approve leave requests"
          checked={form.auto_approve_leave}
          onChange={(val) => setForm({ ...form, auto_approve_leave: val })}
        />
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          When enabled, new leave is approved automatically and roster cells update to Leave.
        </p>
      </Card>

      <Card
        title="Sites & locations"
        actions={
          <Button as={Link} to="/plants" variant="secondary" className="text-xs">
            Manage all
          </Button>
        }
      >
        {data?.plants?.length ? (
          <ul className="divide-y divide-[var(--border)]">
            {data.plants.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">{p.plant_name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {p.plant_code}
                    {p.location ? ` · ${p.location}` : ''}
                  </p>
                </div>
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            No plants yet.{' '}
            <Link to="/plants" className="font-medium text-blue-600 hover:underline">
              Add your first site
            </Link>
            .
          </p>
        )}
      </Card>

      <Card title="Quick links">
        <ul className="grid gap-2 sm:grid-cols-2">
          {QUICK_LINKS.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium transition hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-500/5"
              >
                <span className="flex items-center gap-2 text-[var(--text-primary)]">
                  <Icon className="h-4 w-4 text-blue-600" />
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save organization'}
        </Button>
      </div>
    </div>
  );
}
