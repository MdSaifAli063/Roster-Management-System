import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import EmployeeFilterForm, { buildQuery } from '../components/EmployeeFilterForm';
import RosterGrid from '../components/RosterGrid';
import ShiftEditModal from '../components/AssignModal';
import { eachDate as dateRange } from '../lib/utils';
import { downloadRosterExcel, downloadRosterPdf } from '../api/export';
import { useAuth } from '../context/AuthContext';
import { isEmployer, isEmployee } from '../lib/auth';
import PageHeader from '../components/PageHeader';

export default function ViewRoster() {
  const { user } = useAuth();
  const employer = isEmployer(user?.role);
  const employeeUser = isEmployee(user?.role);
  const location = useLocation();
  const [periodStatus, setPeriodStatus] = useState({ status: 'DRAFT' });
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [filters, setFilters] = useState({});
  const [dateFrom, setDateFrom] = useState(location.state?.startDate || '');
  const [dateTo, setDateTo] = useState(location.state?.endDate || '');
  const [employees, setEmployees] = useState([]);
  const [rosterMap, setRosterMap] = useState({});
  const [dates, setDates] = useState([]);
  const [modal, setModal] = useState({ open: false, employee: null, date: null, cell: null });
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(employeeUser);

  const loadRoster = useCallback(async (empList, from, to) => {
    if (!from || !to || !empList.length) return;
    const ids = empList.map((e) => e.id).join(',');
    const { data } = await api.get('/rosters', {
      params: { emp_ids: ids, start_date: from, end_date: to },
    });
    const map = {};
    data.forEach((r) => {
      map[`${r.emp_id}-${r.roster_date?.slice?.(0, 10) || r.roster_date}`] = r;
    });
    setRosterMap(map);
    setDates(dateRange(from, to));
  }, []);

  const loadPeriodStatus = async (from, to, plantId) => {
    if (!from || !to) return;
    try {
      const { data } = await api.get('/rosters/period-status', {
        params: { start_date: from, end_date: to, plant_id: plantId || undefined },
      });
      setPeriodStatus(data);
    } catch {
      setPeriodStatus({ status: 'DRAFT' });
    }
  };

  const loadMyRoster = useCallback(async (from, to) => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard/employee');
      if (!data.linked || !data.employee) {
        setMyProfile(null);
        setEmployees([]);
        return;
      }
      setMyProfile(data.employee);
      const list = [data.employee];
      setEmployees(list);
      await loadRoster(list, from, to);
      await loadPeriodStatus(from, to, data.employee.plant_id);
    } finally {
      setLoading(false);
    }
  }, [loadRoster]);

  const handleSearch = async () => {
    if (!dateFrom || !dateTo) {
      alert('Select date range');
      return;
    }
    if (employeeUser) {
      await loadMyRoster(dateFrom, dateTo);
      return;
    }
    const params = buildQuery(filters);
    const { data: emps } = await api.get('/employees', { params });
    let list = emps;
    if (location.state?.empIds?.length) {
      list = emps.filter((e) => location.state.empIds.includes(e.id));
    }
    setEmployees(list);
    await loadRoster(list, dateFrom, dateTo);
    await loadPeriodStatus(dateFrom, dateTo, filters.plant_id);
  };

  useEffect(() => {
    if (!employeeUser) return;
    const now = new Date();
    const from = format(startOfMonth(now), 'yyyy-MM-dd');
    const to = format(endOfMonth(now), 'yyyy-MM-dd');
    setDateFrom(from);
    setDateTo(to);
    loadMyRoster(from, to);
  }, [employeeUser, loadMyRoster]);

  useEffect(() => {
    if (!employeeUser && location.state?.empIds) {
      setDateFrom(location.state.startDate || '');
      setDateTo(location.state.endDate || '');
      handleSearch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const publishRoster = async (sendEmail) => {
    setPublishing(true);
    try {
      const { data } = await api.post('/rosters/publish', {
        start_date: dateFrom,
        end_date: dateTo,
        plant_id: filters.plant_id,
        send_email: sendEmail,
      });
      setPeriodStatus({ status: 'PUBLISHED' });
      setPublishOpen(false);
      alert(
        sendEmail
          ? `Roster published. ${data.emailed ?? 0} email(s) sent (each with Excel + PDF attached when SMTP is enabled).`
          : 'Roster published (no emails sent).'
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const exportExcel = () => {
    const ids = employees.map((e) => e.id).join(',');
    downloadRosterExcel({ start_date: dateFrom, end_date: dateTo, emp_ids: ids });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        pathname={location.pathname}
        subtitle={
          employeeUser && myProfile
            ? `${myProfile.emp_name} · ${myProfile.emp_code} — read-only schedule`
            : employer
              ? 'Search and publish rosters for your team'
              : undefined
        }
        actions={
          employeeUser ? (
            <Button variant="secondary" onClick={() => loadMyRoster(dateFrom, dateTo)} disabled={loading}>
              Refresh
            </Button>
          ) : null
        }
      />

      {periodStatus.status === 'PUBLISHED' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
            Published roster
          </span>
          {employeeUser && (
            <span className="text-sm text-[var(--text-secondary)]">
              Your official schedule for this period
            </span>
          )}
        </div>
      )}

      {employer && publishOpen && (
        <Card title="Publish roster">
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            <strong>Send to Employees</strong> publishes the period and emails each person their roster as{' '}
            <span className="font-mono text-emerald-400">.xlsx</span> + <span className="font-mono text-emerald-400">.pdf</span>{' '}
            (requires SMTP in server .env). <strong>Publish only</strong> marks it published without email.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={publishing} onClick={() => publishRoster(true)}>Send to Employees</Button>
            <Button variant="secondary" disabled={publishing} onClick={() => publishRoster(false)}>Publish only</Button>
            <Button variant="ghost" onClick={exportExcel}>Download Excel</Button>
            <Button variant="ghost" onClick={() => downloadRosterPdf({ start_date: dateFrom, end_date: dateTo, emp_ids: employees.map((e) => e.id).join(',') })}>Download PDF</Button>
            <Button variant="ghost" onClick={() => setPublishOpen(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card title={employeeUser ? 'My schedule' : 'Search'}>
        {employeeUser ? (
          <div className="space-y-4">
            {myProfile ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Viewing shifts for <strong className="text-[var(--text-primary)]">{myProfile.emp_name}</strong>.
                Approved leave shows as <span className="text-violet-400">Leave</span>; holidays as <span className="text-red-400">PH</span>.
              </p>
            ) : (
              <p className="text-sm text-amber-400">
                Your login is not linked to an employee record. Contact your employer.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button variant="primary" onClick={handleSearch} disabled={loading || !myProfile}>
              {loading ? 'Loading…' : 'Show my roster'}
            </Button>
          </div>
        ) : (
          <>
            <EmployeeFilterForm
              filters={filters}
              onChange={setFilters}
              onSubmit={handleSearch}
              extraFields={
                <>
                  <Input label="Date From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  <Input label="Date To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </>
              }
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {employer && employees.length > 0 && (
                <Button variant="primary" onClick={() => setPublishOpen(true)}>Publish Roster</Button>
              )}
              <Button variant="secondary" onClick={exportExcel}>Export to Excel</Button>
            </div>
          </>
        )}
      </Card>

      {loading && employeeUser && (
        <p className="text-center text-sm text-[var(--text-secondary)]">Loading your roster…</p>
      )}

      {!loading && employees.length > 0 && dates.length > 0 && (
        <RosterGrid
          employees={employees}
          dates={dates}
          rosterMap={rosterMap}
          readOnly={employeeUser}
          onCellClick={
            employer
              ? (emp, date, cell) => setModal({ open: true, employee: emp, date, cell })
              : undefined
          }
        />
      )}

      {!loading && employeeUser && employees.length === 0 && myProfile && (
        <Card title="No shifts yet">
          <p className="text-sm text-[var(--text-secondary)]">
            No roster entries for this date range. Try another month or ask your employer to publish the roster.
          </p>
        </Card>
      )}

      {employer && (
        <ShiftEditModal
          open={modal.open}
          onClose={() => setModal({ open: false, employee: null, date: null, cell: null })}
          employee={modal.employee}
          date={modal.date}
          cell={modal.cell}
          onSaved={() => loadRoster(employees, dateFrom, dateTo)}
        />
      )}
    </div>
  );
}
