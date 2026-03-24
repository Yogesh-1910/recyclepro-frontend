import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useMaterialTypes } from '../hooks/useMaterialTypes';
import { Card, SectionTitle, Input, Button, Badge, Spinner, EmptyState, DatePicker } from '../components/UI';
import toast from 'react-hot-toast';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const emptyForm = { seller: '', vehicle: '', totalWeight: '', breakdown: {}, date: todayStr() };

export default function ScrapPage() {
  const { types, loading: typesLoading } = useMaterialTypes();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [list, setList] = useState([]);
  const [viewDate, setViewDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadList(); }, [viewDate]);

  async function loadList() {
    setLoading(true);
    try { setList(await api.getScrap(viewDate)); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setBreakdown(tp, val) { setForm(f => ({ ...f, breakdown: { ...f.breakdown, [tp]: val } })); }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      seller: item.seller,
      vehicle: item.vehicle || '',
      totalWeight: String(item.total_weight),
      breakdown: item.breakdown || {},
      date: item.date,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm, date: todayStr() });
  }

  const typeTotal = Object.values(form.breakdown).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalWeightNum = parseFloat(form.totalWeight) || 0;

  async function handleSave() {
    if (!form.seller.trim()) { toast.error('Enter seller name'); return; }
    if (!form.totalWeight || totalWeightNum <= 0) { toast.error('Enter total weight'); return; }
    setSaving(true);
    try {
      const cleanBreakdown = {};
      types.forEach(tp => { const v = parseFloat(form.breakdown[tp]) || 0; if (v > 0) cleanBreakdown[tp] = v; });
      const payload = { seller: form.seller.trim(), vehicle: form.vehicle.trim() || null, total_weight: totalWeightNum, breakdown: cleanBreakdown, date: form.date };
      if (editingId) {
        await api.updateScrap(editingId, payload);
        toast.success('Scrap purchase updated');
        setEditingId(null);
      } else {
        await api.addScrap(payload);
        toast.success('Scrap purchase saved');
      }
      setForm({ ...emptyForm, date: todayStr() });
      loadList();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this scrap purchase?')) return;
    try { await api.deleteScrap(id); toast.success('Deleted'); loadList(); }
    catch { toast.error('Delete failed'); }
  }

  return (
    <div className="fade-in">
      <SectionTitle>{editingId ? 'Edit scrap purchase' : 'New scrap purchase'}</SectionTitle>
      <Card>
        {editingId && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <span className="text-sm text-brand-600 font-medium">✏️ Editing entry</span>
            <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-600 underline">Cancel</button>
          </div>
        )}

        {/* Date picker */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Date</label>
          <input type="date" value={form.date} max={todayStr()}
            onChange={e => setF('date', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
          {form.date !== todayStr() && (
            <div className="text-xs text-amber-600 mt-1">📅 Entering for: {fmtDate(form.date)}</div>
          )}
        </div>

        <Input label="Seller name *" placeholder="e.g. Raju Trading"
          value={form.seller} onChange={e => setF('seller', e.target.value)} />
        <Input label="Vehicle number" placeholder="e.g. MH-12-AB-1234"
          value={form.vehicle} onChange={e => setF('vehicle', e.target.value)} />
        <Input label="Total weight (kg) *" type="number" placeholder="0"
          value={form.totalWeight} onChange={e => setF('totalWeight', e.target.value)} />

        {!typesLoading && types.length > 0 && (
          <div className="border-t border-gray-100 my-3 pt-3">
            <div className="text-xs text-gray-500 font-medium mb-3">Type-wise breakdown (kg) — optional</div>
            <div className="grid grid-cols-2 gap-x-3">
              {types.map(tp => (
                <Input key={tp} label={tp} type="number" placeholder="0"
                  value={form.breakdown[tp] || ''}
                  onChange={e => setBreakdown(tp, e.target.value)} />
              ))}
            </div>
            {typeTotal > 0 && (
              <div className="text-xs mb-2">
                <span className="text-gray-400">Breakdown total: </span>
                <span className={typeTotal > totalWeightNum && totalWeightNum > 0 ? 'text-red-500 font-medium' : 'font-medium text-gray-700'}>{typeTotal} kg</span>
                {totalWeightNum > 0 && Math.abs(typeTotal - totalWeightNum) > 0.01 && <span className="text-amber-500 ml-2">≠ total weight</span>}
              </div>
            )}
          </div>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : editingId ? 'Update purchase' : 'Save purchase'}
        </Button>
      </Card>

      {/* Browse by date */}
      <div className="flex items-center justify-between mt-5 mb-2 px-1">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Purchases</h3>
        <DatePicker value={viewDate} onChange={setViewDate} />
      </div>
      {viewDate !== todayStr() && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Showing: <span className="font-medium text-gray-700">{fmtDate(viewDate)}</span></span>
          <button onClick={() => setViewDate(todayStr())} className="text-xs text-brand-600 underline">Back to today</button>
        </div>
      )}

      <Card className="px-0 py-0 overflow-hidden">
        {loading ? <Spinner /> : list.length === 0 ? (
          <EmptyState message={`No purchases for ${fmtDate(viewDate)}`} />
        ) : (
          list.map(item => (
            <div key={item.id} className={`px-4 py-3 border-b border-gray-100 last:border-0 ${editingId === item.id ? 'bg-brand-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{item.seller}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.vehicle || 'No vehicle'} · {fmtDate(item.date)} · {fmtTime(item.created_at)}</div>
                  {item.breakdown && Object.keys(item.breakdown).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(item.breakdown).filter(([, v]) => v > 0).map(([tp, v]) => (
                        <Badge key={tp} color="gray">{tp}: {v}kg</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-3 ml-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{item.total_weight} kg</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => startEdit(item)}
                      className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium">Edit</button>
                    <button onClick={() => handleDelete(item.id)}
                      className="text-xs px-2 py-0.5 bg-red-50 text-red-400 rounded hover:bg-red-100">Del</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
      {list.length > 0 && (
        <div className="mt-2 text-right text-xs text-gray-400 px-1">
          Total: <span className="font-semibold text-gray-600">{list.reduce((s, i) => s + i.total_weight, 0)} kg</span>
        </div>
      )}
    </div>
  );
}