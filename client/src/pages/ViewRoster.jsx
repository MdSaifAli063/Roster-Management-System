import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import EmployeeFilterForm, { buildQuery } from '../components/EmployeeFilterForm';
import RosterGrid from '../components/RosterGrid';
import ShiftEditModal from '../components/AssignModal';
import { eachDate as dateRange } from '../lib/utils';
import { downloadRosterExcel } from '../api/export';

export default function ViewRoster() {
  const location = useLocation();
  const [filters, setFilters] = useState({});
  const [dateFrom, setDateFrom] = useState(location.state?.startDate || '');
  const [dateTo, setDateTo] = useState(location.state?.endDate || '');
  const [employees, setEmployees] = useState([]);
  const [rosterMap, setRosterMap] = useState({});
  const [dates, setDates] = useState([]);
  const [modal, setModal] = useState({ open: false, employee: null, date: null, cell: null });

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

  const handleSearch = async () => {
    const params = buildQuery(filters);
    const { data: emps } = await api.get('/employees', { params });
    let list = emps;
    if (location.state?.empIds?.length) {
      list = emps.filter((e) => location.state.empIds.includes(e.id));
    }
    setEmployees(list);
    await loadRoster(list, dateFrom, dateTo);
  };

  useEffect(() => {
    if (location.state?.empIds) {
      setDateFrom(location.state.startDate || '');
      setDateTo(location.state.endDate || '');
      handleSearch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const exportExcel = () => {
    const ids = employees.map((e) => e.id).join(',');
    downloadRosterExcel({ start_date: dateFrom, end_date: dateTo, emp_ids: ids });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy dark:text-white">View Roster</h1>

      <Card title="Search">
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
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={exportExcel}>Export to Excel</Button>
        </div>
      </Card>

      {employees.length > 0 && dates.length > 0 && (
        <RosterGrid
          employees={employees}
          dates={dates}
          rosterMap={rosterMap}
          onCellClick={(emp, date, cell) => setModal({ open: true, employee: emp, date, cell })}
        />
      )}

      <ShiftEditModal
        open={modal.open}
        onClose={() => setModal({ open: false, employee: null, date: null, cell: null })}
        employee={modal.employee}
        date={modal.date}
        cell={modal.cell}
        onSaved={() => loadRoster(employees, dateFrom, dateTo)}
      />
    </div>
  );
}
