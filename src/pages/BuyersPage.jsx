import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Card, SectionTitle, Input, Button, Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const empty = { name: '', gst_number: '', address: '', phone: '' };

export default function BuyersPage() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null); // buyer id being edited
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setBuyers(await api.getBuyers()); }
    catch { toast.error('Failed to load buyers'); }
    finally { setLoading(false); }
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function startEdit(b) {
    setEditing(b.id);
    setForm({ name: b.name, gst_number: b.gst_number || '', address: b.address || '', phone: b.phone || '' });
    window.scrollTo(0, 0);
  }

  function cancelEdit() { setEditing(null); setForm(empty); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.updateBuyer(editing, form);
        toast.success('Buyer updated');
        setEditing(null);
      } else {
        await api.addBuyer(form);
        toast.success('Buyer added');
      }
      setForm(empty);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this buyer?')) return;
    try { await api.deleteBuyer(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  const filtered = buyers.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.gst_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <SectionTitle>{editing ? 'Edit buyer' : 'Add new buyer'}</SectionTitle>
      <Card>
        {editing && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <span className="text-sm text-brand-600 font-medium">Editing: {form.name}</span>
            <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        )}
        <Input label="Company / Buyer name *" placeholder="e.g. ABC Plastics Pvt Ltd"
          value={form.name} onChange={e => set('name', e.target.value)} />
        <div className="grid grid-cols-2 gap-x-3">
          <Input label="GST number" placeholder="27XXXXX..."
            value={form.gst_number} onChange={e => set('gst_number', e.target.value)} />
          <Input label="Phone" placeholder="+91 99999 99999"
            value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <Input label="Address" placeholder="Full address"
          value={form.address} onChange={e => set('address', e.target.value)} />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : editing ? 'Update buyer' : 'Add buyer'}
        </Button>
      </Card>

      <SectionTitle>Buyers list ({buyers.length})</SectionTitle>
      <div className="mb-2">
        <Input placeholder="Search by name or GST..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState message={search ? 'No buyers match your search' : 'No buyers added yet'} />
      ) : (
        filtered.map(b => (
          <Card key={b.id} className="mb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">{b.name}</div>
                {b.gst_number && <div className="text-xs text-gray-500 mt-0.5">GST: {b.gst_number}</div>}
                {b.phone && <div className="text-xs text-gray-500">📞 {b.phone}</div>}
                {b.address && <div className="text-xs text-gray-400 mt-1 truncate">{b.address}</div>}
              </div>
              <div className="flex gap-2 ml-3 shrink-0">
                <button onClick={() => startEdit(b)}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 bg-brand-50 rounded-md">
                  Edit
                </button>
                <button onClick={() => handleDelete(b.id)}
                  className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 bg-red-50 rounded-md">
                  Del
                </button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
