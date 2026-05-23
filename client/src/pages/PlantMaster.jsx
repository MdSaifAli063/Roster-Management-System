import { useEffect, useState } from 'react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Pencil } from 'lucide-react';
import PageShell from '../components/layout/PageShell';

export default function PlantMaster() {
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);

  const load = (q) => api.get('/plants', { params: q ? { search: q } : {} }).then((r) => setPlants(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (form.id) await api.put(`/plants/${form.id}`, form);
    else await api.post('/plants', form);
    setForm(null);
    load(search);
  };

  return (
    <PageShell
      subtitle="Sites and plants used for rostering and holiday rules."
      actions={
        <Button variant="primary" onClick={() => setForm({ plant_code: '', plant_name: '', location: '', description: '' })}>
          <Plus className="h-4 w-4" /> Add plant
        </Button>
      }
    >

      <Card>
        <Input label="Search" value={search} onChange={(e) => { setSearch(e.target.value); load(e.target.value); }} className="mb-4 max-w-xs" />
        <div className="table-scroll">
        <table className="min-w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="p-2">Code</th><th className="p-2">Name</th><th className="p-2">Location</th><th className="p-2">Description</th><th /></tr></thead>
          <tbody>
            {plants.map((p) => (
              <tr key={p.id} className="border-b dark:border-slate-800">
                <td className="p-2 font-mono">{p.plant_code}</td>
                <td className="p-2">{p.plant_name}</td>
                <td className="p-2">{p.location}</td>
                <td className="p-2 text-slate-500">{p.description}</td>
                <td className="p-2"><button type="button" onClick={() => setForm({ ...p })} className="text-teal"><Pencil className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card title={form.id ? 'Edit Plant' : 'New Plant'} className="w-full max-w-md">
            <form onSubmit={save} className="space-y-3">
              <Input label="Plant Code" value={form.plant_code} onChange={(e) => setForm({ ...form, plant_code: e.target.value })} required />
              <Input label="Plant Name" value={form.plant_name} onChange={(e) => setForm({ ...form, plant_name: e.target.value })} required />
              <Input label="Location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Input label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex gap-2">
                <Button type="submit" variant="teal">Save</Button>
                <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
