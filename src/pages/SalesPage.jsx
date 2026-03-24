import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useMaterialTypes, useGodowns } from '../hooks/useMaterialTypes';
import { Card, SectionTitle, Select, Input, Button, Badge, Spinner, EmptyState, DatePicker } from '../components/UI';
import InvoicePage from './InvoicePage';
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

const emptyForm = { buyerName: '', gstNumber: '', vehicle: '', granuleType: '', dispatchGodown: '', bags: '', ratePerKg: '', date: todayStr() };

export default function SalesPage() {
  const { types, loading: typesLoading } = useMaterialTypes();
  const { godowns } = useGodowns();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [list, setList] = useState([]);
  const [viewDate, setViewDate] = useState(todayStr());
  const [stock, setStock] = useState({});
  const [buyers, setBuyers] = useState([]);
  const [defaultRates, setDefaultRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceSaleId, setInvoiceSaleId] = useState(null);

  useEffect(() => { loadAll(); }, [viewDate]);
  useEffect(() => {
    if (types.length > 0 && !form.granuleType) {
      setForm(f => ({ ...f, granuleType: types[0], ratePerKg: defaultRates[types[0]] != null ? String(defaultRates[types[0]]) : '' }));
    }
  }, [types, defaultRates]);

  async function loadAll() {
    setLoading(true);
    try {
      const [l, s, b, r] = await Promise.all([api.getSales(viewDate), api.getStock(), api.getBuyers(), api.getRates()]);
      setList(l); setStock(s); setBuyers(b);
      const rmap = {};
      r.forEach(row => { rmap[row.granule_type] = row.rate_per_kg; });
      setDefaultRates(rmap);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function onTypeChange(type) {
    setForm(f => ({ ...f, granuleType: type, ratePerKg: defaultRates[type] != null ? String(defaultRates[type]) : '' }));
  }

  function onBuyerSelect(name) {
    const b = buyers.find(x => x.name === name);
    setForm(f => ({ ...f, buyerName: name, gstNumber: b ? (b.gst_number || '') : f.gstNumber }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      buyerName: item.buyer_name,
      gstNumber: item.gst_number || '',
      vehicle: item.vehicle || '',
      granuleType: item.granule_type,
      dispatchGodown: item.godown || '',
      bags: String(item.bags),
      ratePerKg: String(item.rate_per_kg || ''),
      date: item.date,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm, granuleType: types[0] || '', date: todayStr() });
  }

  const availableBags = (stock[form.granuleType] || 0) + (editingId ? (list.find(i => i.id === editingId)?.bags || 0) : 0);
  const bagsNum = parseInt(form.bags) || 0;
  const rateNum = parseFloat(form.ratePerKg) || 0;
  const estimatedAmount = rateNum * bagsNum * 25;

  async function handleSave() {
    if (!form.buyerName.trim()) { toast.error('Enter buyer name'); return; }
    if (!form.granuleType) { toast.error('Select granule type'); return; }
    if (bagsNum <= 0) { toast.error('Enter number of bags'); return; }
    if (!editingId && bagsNum > (stock[form.granuleType] || 0)) {
      toast.error(`Only ${stock[form.granuleType] || 0} bags of ${form.granuleType} available`); return;
    }
    setSaving(true);
    try {
      const payload = { buyer_name: form.buyerName.trim(), gst_number: form.gstNumber.trim() || null, vehicle: form.vehicle.trim() || null, granule_type: form.granuleType, godown: form.dispatchGodown || null, bags: bagsNum, rate_per_kg: rateNum, date: form.date };
      if (editingId) {
        await api.updateSale(editingId, payload);
        toast.success('Sale updated');
        setEditingId(null);
      } else {
        const result = await api.addSale(payload);
        toast.success(`Sale recorded · ${result.invoice_number}`);
      }
      setForm({ ...emptyForm, granuleType: types[0] || '', date: todayStr() });
      loadAll();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this sale?')) return;
    try { await api.deleteSale(id); toast.success('Deleted'); loadAll(); }
    catch { toast.error('Delete failed'); }
  }

  const totalSold = list.reduce((s, i) => s + i.bags, 0);
  const totalRevenue = list.reduce((s, i) => s + (i.total_amount || 0), 0);

  if (typesLoading) return <Spinner />;

  return (
    <div className="fade-in">
      {invoiceSaleId && <InvoicePage saleId={invoiceSaleId} onClose={() => setInvoiceSaleId(null)} />}

      {/* Stock summary — always show */}
      {types.length > 0 && !editingId && (
        <>
          <SectionTitle>Current granule stock</SectionTitle>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {types.map(tp => (
              <div key={tp} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">{tp}</div>
                  <div className="text-lg font-semibold text-gray-800">{stock[tp] || 0}</div>
                  <div className="text-xs text-gray-400">bags</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${(stock[tp] || 0) > 0 ? 'bg-brand-500' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>{editingId ? 'Edit sale' : 'New sale / dispatch'}</SectionTitle>
      <Card>
        {editingId && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <span className="text-sm text-brand-600 font-medium">✏️ Editing sale</span>
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

        {types.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-3 text-center">Add material types in Settings first</p>
        ) : (
          <>
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Buyer name *</label>
              <input list="buyers-list" value={form.buyerName} onChange={e => onBuyerSelect(e.target.value)}
                placeholder="Type or select buyer..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
              <datalist id="buyers-list">{buyers.map(b => <option key={b.id} value={b.name} />)}</datalist>
            </div>

            <div className="grid grid-cols-2 gap-x-3">
              <Input label="GST number" placeholder="Auto-filled" value={form.gstNumber} onChange={e => setF('gstNumber', e.target.value)} />
              <Input label="Vehicle number" placeholder="Optional" value={form.vehicle} onChange={e => setF('vehicle', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-x-3">
              <Select label="Granule type" value={form.granuleType} onChange={e => onTypeChange(e.target.value)} options={types} />
              <Input label="Bags" type="number" placeholder="0" value={form.bags} onChange={e => setF('bags', e.target.value)} />
            </div>

            {godowns.length > 0 && (
              <Select label="Dispatch from godown (optional)" value={form.dispatchGodown}
                onChange={e => setF('dispatchGodown', e.target.value)}
                options={[{ value: '', label: '— Any / not specified —' }, ...godowns.map(g => ({ value: g, label: g }))]} />
            )}

            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Rate per kg (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <input type="number" step="0.01" min="0" value={form.ratePerKg}
                  onChange={e => setF('ratePerKg', e.target.value)}
                  placeholder="0.00" className="w-full border border-gray-200 rounded-lg pl-7 pr-12 py-2 text-sm bg-white text-gray-900" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/kg</span>
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1">
              {!editingId && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Available</span>
                  <span className={`font-medium ${(stock[form.granuleType] || 0) === 0 ? 'text-red-500' : 'text-brand-600'}`}>
                    {stock[form.granuleType] || 0} bags of {form.granuleType}
                  </span>
                </div>
              )}
              {bagsNum > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Weight</span><span className="font-medium">{bagsNum * 25} kg</span></div>}
              {bagsNum > 0 && rateNum > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Rate per bag</span><span className="font-medium">₹{(rateNum * 25).toFixed(2)}</span></div>}
              {estimatedAmount > 0 && (
                <div className="flex justify-between text-xs font-semibold text-gray-800 border-t border-gray-200 pt-1 mt-1">
                  <span>Total amount</span>
                  <span className="text-brand-600">₹{estimatedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {!editingId && bagsNum > 0 && bagsNum > (stock[form.granuleType] || 0) && (
                <div className="text-xs text-red-500 font-medium">⚠ Exceeds available stock</div>
              )}
            </div>

            <Button onClick={handleSave} disabled={saving || (!editingId && (stock[form.granuleType] || 0) === 0 && !editingId)}>
              {saving ? 'Saving...' : editingId ? 'Update sale' : (!editingId && (stock[form.granuleType] || 0) === 0 ? 'No stock available' : 'Record sale & generate invoice')}
            </Button>
          </>
        )}
      </Card>

      {/* Browse by date */}
      <div className="flex items-center justify-between mt-5 mb-2 px-1">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Sales entries</h3>
        <DatePicker value={viewDate} onChange={setViewDate} />
      </div>
      {viewDate !== todayStr() && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Showing: <span className="font-medium text-gray-700">{fmtDate(viewDate)}</span></span>
          <button onClick={() => setViewDate(todayStr())} className="text-xs text-brand-600 underline">Back to today</button>
        </div>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-brand-50 rounded-xl p-3 text-center">
            <div className="text-xs text-brand-600 opacity-70 mb-1">Bags sold</div>
            <div className="text-xl font-semibold text-brand-600">{totalSold}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xs text-green-700 opacity-70 mb-1">Revenue</div>
            <div className="text-xl font-semibold text-green-700">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      )}

      <Card className="px-0 py-0 overflow-hidden">
        {loading ? <Spinner /> : list.length === 0 ? (
          <EmptyState message={`No sales for ${fmtDate(viewDate)}`} />
        ) : (
          list.map(item => (
            <div key={item.id} className={`px-4 py-3 border-b border-gray-100 last:border-0 ${editingId === item.id ? 'bg-brand-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{item.buyer_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.granule_type} · {item.vehicle || 'No vehicle'} · {fmtDate(item.date)} · {fmtTime(item.created_at)}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge color="gray">{item.invoice_number}</Badge>
                    {item.total_amount > 0 && <span className="text-xs font-medium text-green-600">₹{item.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>}
                  </div>
                </div>
                <div className="flex items-start gap-3 ml-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{item.bags} bags</div>
                    <div className="text-xs text-gray-400">{item.bags * 25} kg</div>
                    <button onClick={() => setInvoiceSaleId(item.id)} className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-1">Invoice ↗</button>
                  </div>
                  <div className="flex flex-col gap-1 mt-0.5">
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
          Total: <span className="font-semibold text-gray-600">{totalSold} bags · ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
      )}
    </div>
  );
}