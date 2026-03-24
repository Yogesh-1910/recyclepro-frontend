import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useMaterialTypes, useGodowns } from '../hooks/useMaterialTypes';
import { Card, SectionTitle, Select, Input, Button, Badge, Spinner, EmptyState, DatePicker } from '../components/UI';
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

const emptyForm = { godown: '', shift: 'Day', granuleType: '', bags: '', date: todayStr() };

export default function ProductionPage() {
  const { types, loading: typesLoading } = useMaterialTypes();
  const { godowns, loading: godownsLoading } = useGodowns();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = adding new, id = editing
  const [list, setList] = useState([]);
  const [viewDate, setViewDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadList(); }, [viewDate]);
  useEffect(() => {
    if (types.length > 0 && !form.granuleType) setForm(f => ({ ...f, granuleType: types[0] }));
  }, [types]);
  useEffect(() => {
    if (godowns.length > 0 && !form.godown) setForm(f => ({ ...f, godown: godowns[0] }));
  }, [godowns]);

  async function loadList() {
    setLoading(true);
    try { setList(await api.getProduction(viewDate)); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      godown: item.godown,
      shift: item.shift,
      granuleType: item.granule_type,
      bags: String(item.bags),
      date: item.date,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm, godown: godowns[0] || '', granuleType: types[0] || '', date: todayStr() });
  }

  async function handleSave() {
    if (!form.godown) { toast.error('Select a godown'); return; }
    if (!form.granuleType) { toast.error('Select a granule type'); return; }
    if (!form.bags || parseInt(form.bags) <= 0) { toast.error('Enter number of bags'); return; }
    setSaving(true);
    try {
      const payload = { godown: form.godown, shift: form.shift, granule_type: form.granuleType, bags: parseInt(form.bags), date: form.date };
      if (editingId) {
        await api.updateProduction(editingId, payload);
        toast.success('Production entry updated');
        setEditingId(null);
      } else {
        await api.addProduction(payload);
        toast.success('Production entry saved');
      }
      setForm({ ...emptyForm, godown: godowns[0] || '', granuleType: types[0] || '', date: todayStr() });
      loadList();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this production entry?')) return;
    try { await api.deleteProduction(id); toast.success('Deleted'); loadList(); }
    catch { toast.error('Delete failed'); }
  }

  const totalBags = list.reduce((s, p) => s + p.bags, 0);
  const dayBags = list.filter(p => p.shift === 'Day').reduce((s, p) => s + p.bags, 0);
  const nightBags = list.filter(p => p.shift === 'Night').reduce((s, p) => s + p.bags, 0);

  if (typesLoading || godownsLoading) return <Spinner />;
  const notReady = types.length === 0 || godowns.length === 0;

  return (
    <div className="fade-in">
      {/* ── Form ── */}
      <SectionTitle>{editingId ? 'Edit production entry' : 'Log production'}</SectionTitle>
      <Card>
        {editingId && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <span className="text-sm text-brand-600 font-medium">✏️ Editing entry</span>
            <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-600 underline">Cancel</button>
          </div>
        )}

        {/* Shift toggle */}
        <div className="flex gap-2 mb-3">
          {['Day', 'Night'].map(s => (
            <button key={s} onClick={() => setF('shift', s)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                form.shift === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}>{s} shift</button>
          ))}
        </div>

        {/* Date picker — default today, allow past */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Date</label>
          <input type="date" value={form.date} max={todayStr()}
            onChange={e => setF('date', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
          {form.date !== todayStr() && (
            <div className="text-xs text-amber-600 mt-1">
              📅 Entering for past date: {fmtDate(form.date)}
            </div>
          )}
        </div>

        {notReady ? (
          <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
            {types.length === 0 ? 'No material types' : 'No godowns'} configured. Go to Settings.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3">
              <Select label="Godown" value={form.godown} onChange={e => setF('godown', e.target.value)} options={godowns} />
              <Select label="Granule type" value={form.granuleType} onChange={e => setF('granuleType', e.target.value)} options={types} />
            </div>
            <Input label="Number of bags (1 bag = 25 kg)" type="number" placeholder="0"
              value={form.bags} onChange={e => setF('bags', e.target.value)} />
            {parseInt(form.bags) > 0 && (
              <div className="text-xs text-gray-400 -mt-2 mb-3">
                Weight: <span className="font-medium text-gray-600">{parseInt(form.bags) * 25} kg</span>
              </div>
            )}
          </>
        )}

        <Button onClick={handleSave} disabled={saving || notReady}>
          {saving ? 'Saving...' : editingId ? 'Update entry' : 'Save production entry'}
        </Button>
      </Card>

      {/* ── View by date ── */}
      <div className="flex items-center justify-between mt-5 mb-2 px-1">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Production entries</h3>
        <DatePicker value={viewDate} onChange={setViewDate} />
      </div>

      {viewDate !== todayStr() && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Showing: <span className="font-medium text-gray-700">{fmtDate(viewDate)}</span></span>
          <button onClick={() => setViewDate(todayStr())} className="text-xs text-brand-600 underline">Back to today</button>
        </div>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-brand-50 rounded-xl p-3 text-center">
            <div className="text-xs text-brand-600 opacity-70 mb-1">Total</div>
            <div className="text-xl font-semibold text-brand-600">{totalBags}</div>
            <div className="text-xs text-brand-600 opacity-60">bags</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <div className="text-xs text-amber-700 opacity-70 mb-1">Day</div>
            <div className="text-xl font-semibold text-amber-700">{dayBags}</div>
            <div className="text-xs text-amber-700 opacity-60">bags</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-xs text-blue-700 opacity-70 mb-1">Night</div>
            <div className="text-xl font-semibold text-blue-700">{nightBags}</div>
            <div className="text-xs text-blue-700 opacity-60">bags</div>
          </div>
        </div>
      )}

      <Card className="px-0 py-0 overflow-hidden">
        {loading ? <Spinner /> : list.length === 0 ? (
          <EmptyState message={`No production entries for ${fmtDate(viewDate)}`} />
        ) : (
          list.map(item => (
            <div key={item.id} className={`px-4 py-3 border-b border-gray-100 last:border-0 ${editingId === item.id ? 'bg-brand-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{item.godown} · {item.granule_type}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge color={item.shift === 'Day' ? 'amber' : 'blue'}>{item.shift} shift</Badge>
                    <span className="text-xs text-gray-400">{fmtDate(item.date)}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{fmtTime(item.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 ml-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{item.bags} bags</div>
                    <div className="text-xs text-gray-400">{item.bags * 25} kg</div>
                  </div>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <button onClick={() => startEdit(item)}
                      className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="text-xs px-2 py-0.5 bg-red-50 text-red-400 rounded hover:bg-red-100">
                      Del
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}