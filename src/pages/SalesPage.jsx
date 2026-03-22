import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useMaterialTypes, useGodowns } from '../hooks/useMaterialTypes';
import { Card, SectionTitle, Select, Input, Button, Badge, Spinner, EmptyState } from '../components/UI';
import InvoicePage from './InvoicePage';
import toast from 'react-hot-toast';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function SalesPage() {
  const { types, loading: typesLoading } = useMaterialTypes();
  const { godowns } = useGodowns();

  const [buyerName, setBuyerName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [granuleType, setGranuleType] = useState('');
  const [dispatchGodown, setDispatchGodown] = useState('');
  const [bags, setBags] = useState('');
  const [ratePerKg, setRatePerKg] = useState('');

  const [list, setList] = useState([]);
  const [stock, setStock] = useState({});
  const [buyers, setBuyers] = useState([]);
  const [defaultRates, setDefaultRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceSaleId, setInvoiceSaleId] = useState(null);

  useEffect(() => { loadAll(); }, []);

  // Set defaults when types/rates load
  useEffect(() => {
    if (types.length > 0 && !granuleType) {
      setGranuleType(types[0]);
      setRatePerKg(defaultRates[types[0]] != null ? String(defaultRates[types[0]]) : '');
    }
  }, [types, defaultRates]);

  async function loadAll() {
    setLoading(true);
    try {
      const [l, s, b, r] = await Promise.all([
        api.getSales(todayStr()), api.getStock(), api.getBuyers(), api.getRates()
      ]);
      setList(l);
      setStock(s);
      setBuyers(b);
      const rmap = {};
      r.forEach(row => { rmap[row.granule_type] = row.rate_per_kg; });
      setDefaultRates(rmap);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function onTypeChange(type) {
    setGranuleType(type);
    setRatePerKg(defaultRates[type] != null ? String(defaultRates[type]) : '');
  }

  function onBuyerSelect(name) {
    setBuyerName(name);
    const b = buyers.find(x => x.name === name);
    if (b) setGstNumber(b.gst_number || '');
  }

  const availableBags = stock[granuleType] || 0;
  const bagsNum = parseInt(bags) || 0;
  const rateNum = parseFloat(ratePerKg) || 0;
  const weightKg = bagsNum * 25;
  const estimatedAmount = rateNum * weightKg;

  async function handleSave() {
    if (!buyerName.trim()) { toast.error('Enter buyer name'); return; }
    if (!granuleType) { toast.error('Select granule type'); return; }
    if (bagsNum <= 0) { toast.error('Enter number of bags'); return; }
    if (bagsNum > availableBags) { toast.error(`Only ${availableBags} bags of ${granuleType} available`); return; }
    setSaving(true);
    try {
      const result = await api.addSale({
        buyer_name: buyerName.trim(),
        gst_number: gstNumber.trim() || null,
        vehicle: vehicle.trim() || null,
        granule_type: granuleType,
        godown: dispatchGodown || null,
        bags: bagsNum,
        rate_per_kg: rateNum,
        date: todayStr(),
      });
      toast.success(`Sale recorded · ${result.invoice_number}`);
      setBuyerName(''); setGstNumber(''); setVehicle(''); setBags(''); setDispatchGodown('');
      setRatePerKg(defaultRates[granuleType] != null ? String(defaultRates[granuleType]) : '');
      loadAll();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await api.deleteSale(id); toast.success('Deleted'); loadAll(); }
    catch { toast.error('Delete failed'); }
  }

  const totalSold = list.reduce((s, i) => s + i.bags, 0);
  const totalRevenue = list.reduce((s, i) => s + (i.total_amount || 0), 0);

  if (typesLoading) return <Spinner />;

  return (
    <div className="fade-in">
      {invoiceSaleId && <InvoicePage saleId={invoiceSaleId} onClose={() => setInvoiceSaleId(null)} />}

      <SectionTitle>Current granule stock</SectionTitle>
      {types.length === 0 ? (
        <Card><EmptyState message="No material types — configure in Settings" /></Card>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {types.map(t => (
            <div key={t} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">{t}</div>
                <div className="text-lg font-semibold text-gray-800">{stock[t] || 0}</div>
                <div className="text-xs text-gray-400">bags</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${(stock[t] || 0) > 0 ? 'bg-brand-500' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>
      )}

      <SectionTitle>New sale / dispatch</SectionTitle>
      <Card>
        {types.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-3 text-center">
            Add material types in Settings first
          </p>
        ) : (
          <>
            {/* Buyer */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Buyer name *</label>
              <input
                list="buyers-list"
                value={buyerName}
                onChange={e => onBuyerSelect(e.target.value)}
                placeholder="Type or select buyer..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
              />
              <datalist id="buyers-list">
                {buyers.map(b => <option key={b.id} value={b.name} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-x-3">
              <Input label="GST number" placeholder="Auto-filled"
                value={gstNumber} onChange={e => setGstNumber(e.target.value)} />
              <Input label="Vehicle number" placeholder="Optional"
                value={vehicle} onChange={e => setVehicle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-x-3">
              <Select label="Granule type" value={granuleType}
                onChange={e => onTypeChange(e.target.value)} options={types} />
              <Input label="Bags" type="number" placeholder="0"
                value={bags} onChange={e => setBags(e.target.value)} />
            </div>

            {godowns.length > 0 && (
              <Select
                label="Dispatch from godown (optional)"
                value={dispatchGodown}
                onChange={e => setDispatchGodown(e.target.value)}
                options={[{ value: '', label: '— Any / not specified —' }, ...godowns.map(g => ({ value: g, label: g }))]}
              />
            )}

            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Rate per kg (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <input
                  type="number" step="0.01" min="0"
                  value={ratePerKg}
                  onChange={e => setRatePerKg(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-12 py-2 text-sm bg-white text-gray-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/kg</span>
              </div>
            </div>

            {/* Live preview box */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Available</span>
                <span className={`font-medium ${availableBags === 0 ? 'text-red-500' : 'text-brand-600'}`}>
                  {availableBags} bags of {granuleType}
                </span>
              </div>
              {bagsNum > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Weight</span>
                  <span className="font-medium">{weightKg} kg</span>
                </div>
              )}
              {bagsNum > 0 && rateNum > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Rate per bag</span>
                  <span className="font-medium">₹{(rateNum * 25).toFixed(2)}</span>
                </div>
              )}
              {estimatedAmount > 0 && (
                <div className="flex justify-between text-xs font-semibold text-gray-800 border-t border-gray-200 pt-1 mt-1">
                  <span>Total amount</span>
                  <span className="text-brand-600">₹{estimatedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {bagsNum > 0 && bagsNum > availableBags && (
                <div className="text-xs text-red-500 font-medium">⚠ Exceeds available stock</div>
              )}
            </div>

            <Button onClick={handleSave} disabled={saving || availableBags === 0}>
              {saving ? 'Saving...' : availableBags === 0 ? 'No stock available' : 'Record sale & generate invoice'}
            </Button>
          </>
        )}
      </Card>

      {list.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4 mb-2">
          <div className="bg-brand-50 rounded-xl p-3 text-center">
            <div className="text-xs text-brand-600 opacity-70 mb-1">Bags sold</div>
            <div className="text-xl font-semibold text-brand-600">{totalSold}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xs text-green-700 opacity-70 mb-1">Revenue</div>
            <div className="text-xl font-semibold text-green-700">
              ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}

      <SectionTitle>Today's sales</SectionTitle>
      <Card className="px-0 py-0 overflow-hidden">
        {loading ? <Spinner /> : list.length === 0 ? (
          <EmptyState message="No sales recorded today" />
        ) : (
          list.map(item => (
            <div key={item.id} className="px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{item.buyer_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.granule_type} · {item.vehicle || 'No vehicle'} · {fmtTime(item.created_at)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge color="gray">{item.invoice_number}</Badge>
                    {item.total_amount > 0 && (
                      <span className="text-xs font-medium text-green-600">
                        ₹{item.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
                  <div className="text-sm font-semibold text-gray-900">{item.bags} bags</div>
                  <div className="text-xs text-gray-400">{item.bags * 25} kg</div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setInvoiceSaleId(item.id)}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                      Invoice ↗
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="text-xs text-red-400 hover:text-red-600">✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>

      {list.length > 0 && (
        <div className="mt-2 text-right text-xs text-gray-400 px-1">
          Total: <span className="font-semibold text-gray-600">
            {totalSold} bags · ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}
    </div>
  );
}
