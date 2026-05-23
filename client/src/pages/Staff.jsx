import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import PageShell from '../components/layout/PageShell';
import Card from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { AppTable, AppTableBody, AppTableHead, AppTableRow, AppTableTd, AppTableTh } from '../components/ui/AppTable';

export default function Staff() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [employment_type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/staff', { params: { q, employment_type, status } });
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageShell subtitle="Search and manage employee records.">
      <Card title="Search filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, code, email" />
          <Select label="Type" value={employment_type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CASUAL">Casual</option>
          </Select>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Button className="self-end sm:col-span-2 lg:col-span-1" variant="primary" onClick={load} disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </Card>

      <Card title={`${list.length} employees`} padding={false}>
        <AppTable>
          <AppTableHead>
            <AppTableTh>Code</AppTableTh>
            <AppTableTh>Name</AppTableTh>
            <AppTableTh>Type</AppTableTh>
            <AppTableTh>Site</AppTableTh>
            <AppTableTh />
          </AppTableHead>
          <AppTableBody>
            {list.length === 0 ? (
              <AppTableRow>
                <AppTableTd colSpan={5} className="py-10 text-center text-slate-500">
                  No employees found.
                </AppTableTd>
              </AppTableRow>
            ) : (
              list.map((e) => (
                <AppTableRow key={e.id}>
                  <AppTableTd className="font-mono text-xs">{e.emp_code}</AppTableTd>
                  <AppTableTd className="font-medium text-slate-900 dark:text-white">{e.emp_name}</AppTableTd>
                  <AppTableTd>{e.employment_type || '—'}</AppTableTd>
                  <AppTableTd>{e.plant_name || '—'}</AppTableTd>
                  <AppTableTd>
                    <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700" to={`/staff/${e.id}`}>
                      View
                    </Link>
                  </AppTableTd>
                </AppTableRow>
              ))
            )}
          </AppTableBody>
        </AppTable>
      </Card>
    </PageShell>
  );
}
