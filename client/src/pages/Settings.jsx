import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Save, Building2, Upload, CreditCard, Mail, ExternalLink } from 'lucide-react';
import api from '../api/client';
import Button from '../components/ui/Button';
import { Input, Select, Toggle } from '../components/ui/Input';
import PageShell from '../components/layout/PageShell';
import {
  SettingsTabs,
  SettingsSection,
  SettingsFormRow,
  SettingsToggleGroup,
  SettingsToggleRow,
} from '../components/settings/SettingsShell';
import ThemeSettingCards from '../components/settings/ThemeSettingCards';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { isEmployer } from '../lib/auth';
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
} from '../lib/notificationPrefs';
import { loadDisplayPrefs, saveDisplayPrefs } from '../lib/displayPrefs';

const EMPLOYER_TABS = [
  { id: 'company', label: 'Company Information' },
  { id: 'general', label: 'General Information' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'theme', label: 'Theme' },
  { id: 'security', label: 'Security' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'language', label: 'Language' },
];

const EMPLOYEE_TABS = [
  { id: 'general', label: 'General Information' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'theme', label: 'Theme' },
  { id: 'security', label: 'Security' },
  { id: 'language', label: 'Language' },
];

const TIMEZONES = [
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Pacific/Auckland',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

const GENERAL_NOTIFICATIONS = [
  { key: 'systemAnnouncements', label: 'System announcements', desc: 'Platform updates and important service notices.' },
  { key: 'holidayAnnouncements', label: 'Holiday announcements', desc: 'When public or company holidays are added.' },
  { key: 'broadcastMessages', label: 'Broadcast messages', desc: 'Company-wide messages from HR.' },
  { key: 'policyUpdates', label: 'Policy updates', desc: 'Changes to leave or attendance policies.' },
  { key: 'maintenanceAlerts', label: 'Maintenance alerts', desc: 'Scheduled downtime or maintenance windows.' },
];

const ACTIVITY_NOTIFICATIONS = [
  { key: 'leaveRequests', label: 'Leave requests', desc: 'New, approved, or declined leave activity.' },
  { key: 'scheduleChanges', label: 'Schedule changes', desc: 'Roster publishes and shift updates.' },
  { key: 'payrollUpdates', label: 'Payroll & finance updates', desc: 'Finance module and payroll-related alerts.' },
  { key: 'mentions', label: 'Mentions in activity', desc: 'When you are referenced in notifications.' },
  { key: 'onboarding', label: 'New employee onboarding', desc: 'When staff accounts are provisioned.' },
  { key: 'taskReminders', label: 'Task reminders', desc: 'Pending approvals and follow-ups.' },
];

export default function Settings() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const employer = isEmployer(user?.role);
  const tabs = employer ? EMPLOYER_TABS : EMPLOYEE_TABS;
  const [tab, setTab] = useState(tabs[0].id);

  const [editingCompany, setEditingCompany] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyForm, setCompanyForm] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState('');

  const [autoApprove, setAutoApprove] = useState(false);
  const [emailStatus, setEmailStatus] = useState('checking…');
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);
  const [displayPrefs, setDisplayPrefs] = useState(loadDisplayPrefs);

  const { notifications, unreadCount, markAllRead, clearAllNotifications } = useNotifications();
  const [clearingNotifs, setClearingNotifs] = useState(false);

  const loadCompany = useCallback(() => {
    if (!employer) return;
    setCompanyLoading(true);
    api
      .get('/business/organization')
      .then((res) => {
        const b = res.data.business;
        setOwnerEmail(res.data.owner?.email || user?.email || '');
        setCompanyForm({
          business_name: b.business_name || '',
          location_name: b.location_name || '',
          country_code: b.country_code || 'AU',
          timezone: b.timezone || 'Australia/Sydney',
          tax_id: b.tax_id || '',
        });
        setAutoApprove(!!res.data.settings?.auto_approve_leave);
      })
      .catch(() => toast.error('Could not load company settings'))
      .finally(() => setCompanyLoading(false));
  }, [employer, toast, user?.email]);

  useEffect(() => {
    setNotifPrefs(loadNotificationPrefs());
    api.get('/health').then(() => setEmailStatus('SMTP optional — set EMAIL_ENABLED on server for email alerts')).catch(() => setEmailStatus('API unreachable'));
    if (employer) loadCompany();
    else {
      api.get('/settings').then((r) => setAutoApprove(!!r.data.auto_approve_leave)).catch(() => {});
    }
  }, [employer, loadCompany]);

  const saveCompany = async () => {
    if (!companyForm?.business_name?.trim()) {
      toast.error('Company name is required');
      return;
    }
    setCompanySaving(true);
    try {
      const { data } = await api.patch('/business/organization', {
        business_name: companyForm.business_name,
        location_name: companyForm.location_name,
        country_code: companyForm.country_code,
        timezone: companyForm.timezone,
        tax_id: companyForm.tax_id,
      });
      updateUser({ businessName: data.business.business_name });
      setEditingCompany(false);
      toast.success('Company information saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setCompanySaving(false);
    }
  };

  const saveAutoApprove = async (val) => {
    setAutoApprove(val);
    try {
      if (employer) {
        await api.patch('/business/organization', { auto_approve_leave: val });
      } else {
        await api.patch('/settings', { auto_approve_leave: val });
      }
      toast.success('Leave setting updated');
    } catch {
      toast.error('Could not save setting');
    }
  };

  const updateNotifPref = (key, val) => {
    const next = { ...notifPrefs, [key]: val };
    setNotifPrefs(next);
    saveNotificationPrefs(next);
  };

  const updateDisplayPref = (key, val) => {
    const next = { ...displayPrefs, [key]: val };
    setDisplayPrefs(next);
    saveDisplayPrefs(next);
  };

  return (
    <PageShell subtitle="Customize system preferences and configurations." className="pb-10">

      <SettingsTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'company' && employer && (
        <SettingsSection
          title="Company Information"
          description="Manage basic company information and preferences."
          action={
            editingCompany ? (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setEditingCompany(false); loadCompany(); }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={saveCompany} disabled={companySaving}>
                  <Save className="h-4 w-4" />
                  {companySaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            ) : (
              <Button variant="primary" onClick={() => setEditingCompany(true)} disabled={companyLoading}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )
          }
        >
          {companyLoading || !companyForm ? (
            <div className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ) : (
            <>
              <SettingsFormRow label="Company logo" hint="Upload your company logo for reports and branding.">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Building2 className="h-8 w-8" />
                  </span>
                  <div className="flex min-h-[100px] flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-800/30">
                    <Upload className="h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">Logo upload</p>
                    <p className="text-xs text-slate-500">Coming soon · SVG, PNG, JPEG up to 5MB</p>
                  </div>
                </div>
              </SettingsFormRow>

              <SettingsFormRow label="Company name" hint="Legal or trading name shown across RosterPro.">
                <Input
                  value={companyForm.business_name}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, business_name: e.target.value }))}
                  disabled={!editingCompany}
                  success={!!companyForm.business_name?.trim()}
                />
              </SettingsFormRow>

              <SettingsFormRow label="Country" hint="Used for holidays and regional defaults.">
                <Select
                  value={companyForm.country_code}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, country_code: e.target.value }))}
                  disabled={!editingCompany}
                >
                  <option value="AU">Australia</option>
                  <option value="NZ">New Zealand</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="IN">India</option>
                  <option value="SG">Singapore</option>
                </Select>
              </SettingsFormRow>

              <SettingsFormRow label="Office address" hint="Primary work location for your organization.">
                <textarea
                  rows={3}
                  value={companyForm.location_name}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, location_name: e.target.value }))}
                  disabled={!editingCompany}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </SettingsFormRow>

              <SettingsFormRow label="Contact email" hint="Account owner email for billing and alerts.">
                <Input value={ownerEmail} disabled />
              </SettingsFormRow>

              <SettingsFormRow label="Tax / business ID" hint="Optional identifier for reports.">
                <Input
                  value={companyForm.tax_id}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, tax_id: e.target.value }))}
                  disabled={!editingCompany}
                />
              </SettingsFormRow>

              <SettingsFormRow label="Time zone" hint="Used for roster dates and attendance.">
                <Select
                  value={companyForm.timezone}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, timezone: e.target.value }))}
                  disabled={!editingCompany}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
              </SettingsFormRow>

              <SettingsFormRow label="Time format" hint="How times appear in the app for you.">
                <Select
                  value={displayPrefs.timeFormat}
                  onChange={(e) => updateDisplayPref('timeFormat', e.target.value)}
                >
                  <option value="12h">12 hours (AM/PM)</option>
                  <option value="24h">24 hours</option>
                </Select>
              </SettingsFormRow>

              <p className="text-sm text-slate-500">
                For operating hours, employment types, and sites —{' '}
                <Link to="/organization" className="font-medium text-blue-600 hover:underline">
                  open Organization
                </Link>
                .
              </p>
            </>
          )}
        </SettingsSection>
      )}

      {tab === 'general' && (
        <SettingsSection
          title="General Information"
          description="Workforce rules and display preferences."
        >
          {employer && (
            <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <Toggle
                label="Auto-approve leave requests"
                checked={autoApprove}
                onChange={saveAutoApprove}
              />
              <p className="mt-2 text-xs text-slate-500">
                When enabled, new leave is approved automatically and roster cells are marked as leave.
              </p>
            </div>
          )}

          <SettingsFormRow label="Date format" hint="How dates appear in lists and exports.">
            <Select
              value={displayPrefs.dateFormat}
              onChange={(e) => updateDisplayPref('dateFormat', e.target.value)}
            >
              <option value="DMY">DD/MM/YYYY</option>
              <option value="MDY">MM/DD/YYYY</option>
              <option value="YMD">YYYY-MM-DD</option>
            </Select>
          </SettingsFormRow>

          <SettingsFormRow label="Profile" hint="Update your name and account details.">
            <Button as={Link} to="/profile" variant="secondary">
              Open profile <ExternalLink className="h-4 w-4" />
            </Button>
          </SettingsFormRow>
        </SettingsSection>
      )}

      {tab === 'notifications' && (
        <SettingsSection
          title="Notification settings"
          description="Manage which notifications you receive and how you stay updated on important activities."
        >
          <div className="space-y-8">
            <SettingsToggleGroup title="General notifications" description="Platform and company-wide updates.">
              {GENERAL_NOTIFICATIONS.map((item) => (
                <SettingsToggleRow
                  key={item.key}
                  label={item.label}
                  description={item.desc}
                  checked={notifPrefs[item.key]}
                  onChange={(v) => updateNotifPref(item.key, v)}
                />
              ))}
            </SettingsToggleGroup>

            <SettingsToggleGroup title="Activity notifications" description="Day-to-day workforce events.">
              {ACTIVITY_NOTIFICATIONS.map((item) => (
                <SettingsToggleRow
                  key={item.key}
                  label={item.label}
                  description={item.desc}
                  checked={notifPrefs[item.key]}
                  onChange={(v) => updateNotifPref(item.key, v)}
                />
              ))}
            </SettingsToggleGroup>
          </div>

          <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              In-app: <strong>{notifications.length}</strong> saved
              {unreadCount > 0 && (
                <>
                  {' '}
                  (<span className="text-blue-600">{unreadCount} unread</span>)
                </>
              )}
              . Email: {emailStatus}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {unreadCount > 0 && (
                <Button type="button" variant="secondary" onClick={() => markAllRead()}>
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  type="button"
                  variant="danger"
                  disabled={clearingNotifs}
                  onClick={async () => {
                    setClearingNotifs(true);
                    try {
                      await clearAllNotifications();
                    } finally {
                      setClearingNotifs(false);
                    }
                  }}
                >
                  {clearingNotifs ? 'Clearing…' : 'Clear all'}
                </Button>
              )}
            </div>
          </div>
        </SettingsSection>
      )}

      {tab === 'theme' && (
        <SettingsSection
          title="Theme"
          description="Customize the appearance of your dashboard to match your preferences."
        >
          <ThemeSettingCards />
        </SettingsSection>
      )}

      {tab === 'security' && (
        <SettingsSection title="Security" description="Account access and session information.">
          <SettingsFormRow label="Signed in as" hint="Your RosterPro account.">
            <Input value={user?.email || ''} disabled />
          </SettingsFormRow>
          <SettingsFormRow label="Role" hint="Permissions for this workspace.">
            <Input value={user?.role || ''} disabled className="capitalize" />
          </SettingsFormRow>
          <SettingsFormRow label="Password & sign-in" hint="Update credentials or linked Google account.">
            <Button as={Link} to="/profile" variant="primary">
              Manage in Profile
            </Button>
          </SettingsFormRow>
        </SettingsSection>
      )}

      {tab === 'integrations' && employer && (
        <SettingsSection
          title="Integrations"
          description="Connect billing, email, and sign-in services."
        >
          <SettingsFormRow label="Stripe billing" hint="Manage subscription and invoices.">
            <Button as={Link} to="/settings/billing" variant="primary">
              <CreditCard className="h-4 w-4" /> Billing & subscription
            </Button>
          </SettingsFormRow>
          <SettingsFormRow label="Email (SMTP)" hint="Server-side email for leave and mismatch alerts.">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Mail className="h-4 w-4 shrink-0" />
              {emailStatus}
            </div>
          </SettingsFormRow>
          <SettingsFormRow label="Google Sign-In" hint="Configure GOOGLE_CLIENT_ID in server environment.">
            <p className="text-sm text-slate-500">
              Enable Google on the login page by adding a Web OAuth client ID to your server{' '}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code>.
            </p>
          </SettingsFormRow>
        </SettingsSection>
      )}

      {tab === 'language' && (
        <SettingsSection title="Language" description="Interface language preferences.">
          <SettingsFormRow label="Display language" hint="More languages will be added in future releases.">
            <Select value="en" disabled>
              <option value="en">English</option>
            </Select>
          </SettingsFormRow>
          <p className="text-sm text-slate-500">
            RosterPro is currently available in English. Regional date and time formats are configured under General
            and Company tabs.
          </p>
        </SettingsSection>
      )}
    </PageShell>
  );
}
