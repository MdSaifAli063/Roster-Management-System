import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Staff() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [employment_type, setType] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    const { data } = await api.get('/staff', { params: { q, employment_type, status } });
    setList(data);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Staff</h1>
      <Card title="Search">
        <div className="grid gap-3 sm:grid-cols-4">
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
          <Button className="self-end" variant="primary" onClick={load}>Search</Button>
        </div>
      </Card>
      <Card title={`${list.length} employees`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="py-2">Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Plant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-b border-[var(--border)]">
                  <td className="py-2 font-mono">{e.emp_code}</td>
                  <td>{e.emp_name}</td>
                  <td>{e.employment_type || '—'}</td>
                  <td>{e.plant_name || '—'}</td>
                  <td><Link className="text-[var(--accent-primary)] hover:underline" to={`/staff/${e.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
