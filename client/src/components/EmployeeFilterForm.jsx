import { useEffect, useState } from 'react';
import api from '../api/client';
import { Input, Select } from './ui/Input';
import Button from './ui/Button';

const LOCATIONS = ['All', 'Cairo', 'Dubai', 'Gurgaon', 'London', 'Noida', 'Singapore'];

export default function EmployeeFilterForm({ filters, onChange, onSubmit, extraFields, submitLabel = 'Submit' }) {
  const [options, setOptions] = useState({});

  useEffect(() => {
    api.get('/employees/filters').then((r) => setOptions(r.data));
  }, []);

  const multiSelect = (name, label, values = []) => (
    <Select
      label={label}
      multiple
      value={filters[name] || []}
      onChange={(e) => {
        const selected = Array.from(e.target.selectedOptions, (o) => o.value);
        onChange({ ...filters, [name]: selected });
      }}
      className="h-24"
    >
      {values.map((v) => (
        <option key={v} value={v}>{v}</option>
      ))}
    </Select>
  );

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <Input label="Employee Code" value={filters.emp_code || ''} onChange={(e) => onChange({ ...filters, emp_code: e.target.value })} />
      <Input label="Employee Name" value={filters.emp_name || ''} onChange={(e) => onChange({ ...filters, emp_name: e.target.value })} />
      {multiSelect('business_unit', 'Business Unit', options.business_unit)}
      {multiSelect('function', 'Function', options.function)}
      {multiSelect('role', 'Role', options.role)}
      {multiSelect('grade', 'Grades', options.grade)}
      {multiSelect('level', 'Level', options.level)}
      <Select label="Location" value={filters.location || 'All'} onChange={(e) => onChange({ ...filters, location: e.target.value })}>
        {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
      </Select>
      {multiSelect('process', 'Process', options.process)}
      <Input label="Shift" value={filters.shift || ''} onChange={(e) => onChange({ ...filters, shift: e.target.value })} />
      {extraFields}
      <div className="flex items-end sm:col-span-2 lg:col-span-3">
        <Button type="submit" variant="teal">{submitLabel}</Button>
      </div>
    </form>
  );
}

export function buildQuery(filters) {
  const q = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (!v || v === 'All' || (Array.isArray(v) && !v.length)) return;
    q[k] = Array.isArray(v) ? v.join(',') : v;
  });
  return q;
}
