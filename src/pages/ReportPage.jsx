import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Card, SectionTitle, Badge, Spinner, EmptyState, DatePicker } from '../components/UI';
import toast from 'react-hot-toast';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }); }
function fmtTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}

function Row({ label, value, bold, indent, highlight, muted }) {
  return (
    <div className={`flex justify-between py-2 border-b border-gray-100 last:border-0
      ${indent ? 'pl-4' : ''}
      ${highlight ? 'bg-brand-50 -mx-4 px-4 rounded' : ''}
      ${muted ? 'opacity-40' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{value}</span>
    </div>
  );
}

export default function ReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());

  useEffect(() => {
    setLoading(true);
    api.getReport(date).then(setData).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [date]);

  if (loading) return <Spinner />;
  if (!data) return <EmptyState message="No data" />;

  const types = data.materialTypes || [];
  const godownNames = data.godownNames || [];
  const totalProd = (data.prodByShift.Day || 0) + (data.prodByShift.Night || 0);
  const totalSales = data.sales.reduce((s, i) => s + i.bags, 0);
  const totalScrap = data.scraps.reduce((s, i) => s + i.total_weight, 0);
  const totalRevenue = data.totalRevenue || 0;

  // Only types with stock > 0 for the closing stock section
  const stockMap = data.stockMap || {};
  const nonZeroTypes = types.filter(t => (stockMap[t] || 0) > 0);
  const totalStockBags = nonZeroTypes.reduce((s, t) => s + (stockMap[t] || 0), 0);

  // Godown-wise stock — only godowns + types with stock > 0
  const godownStock = data.godownStock || {};
  const godownsWithStock = godownNames.filter(g =>
    types.some(t => (godownStock[g]?.[t] || 0) > 0)
  );

  return (
    <>
      <style>{`
        @media print {
          .no-print { display:none!important; }
          body { background:white; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      <div className="fade-in">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4 no-print">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Daily report</h2>
            <div className="text-xs text-gray-400">{fmtDate(date)}</div>
          </div>
          <DatePicker value={date} onChange={setDate} />
        </div>

        {/* Print header */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-gray-200 pb-4">
          <div className="text-xl font-bold">{data.settings?.name || 'RecyclePro'}</div>
          {data.settings?.gst && <div className="text-sm text-gray-500">GST: {data.settings.gst}</div>}
          {data.settings?.phone && <div className="text-sm text-gray-500">{data.settings.phone}</div>}
          <div className="text-lg font-semibold mt-2">Daily Operations Report</div>
          <div className="text-sm text-gray-500">{fmtDate(date)}</div>
        </div>

        {/* Print button */}
        <div className="no-print mb-4">
          <button onClick={() => window.print()}
            className="w-full py-2.5 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-900 active:scale-95 transition-all">
            🖨 Print / Export as PDF
          </button>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-brand-50 rounded-xl p-3 text-center">
            <div className="text-xs text-brand-600 opacity-70">Production</div>
            <div className="text-2xl font-bold text-brand-600">{totalProd}</div>
            <div className="text-xs text-brand-600 opacity-60">{totalProd * 25} kg</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-xs text-blue-700 opacity-70">Sales</div>
            <div className="text-2xl font-bold text-blue-700">{totalSales}</div>
            <div className="text-xs text-blue-700 opacity-60">{totalSales * 25} kg</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xs text-green-700 opacity-70">Revenue</div>
            <div className="text-xl font-bold text-green-700">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div className="text-xs text-green-700 opacity-60">today</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <div className="text-xs text-amber-700 opacity-70">Scrap in</div>
            <div className="text-xl font-bold text-amber-700">{totalScrap}</div>
            <div className="text-xs text-amber-700 opacity-60">kg</div>
          </div>
        </div>

        {/* ── Production ──────────────────────────── */}
        <SectionTitle>Production</SectionTitle>
        <Card className="p-0 overflow-hidden">
          <div className="px-4">
            <Row label="Day shift"   value={`${data.prodByShift.Day || 0} bags`} indent />
            <Row label="Night shift" value={`${data.prodByShift.Night || 0} bags`} indent />
            <Row label="Total production" value={`${totalProd} bags · ${totalProd * 25} kg`} bold highlight />
          </div>
        </Card>

        {data.production.length > 0 && (
          <>
            <SectionTitle>Production entries</SectionTitle>
            <Card className="p-0 overflow-hidden">
              <div className="px-4">
                {data.production.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{p.godown} · {p.granule_type}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge color={p.shift === 'Day' ? 'amber' : 'blue'}>{p.shift}</Badge>
                        <span className="text-xs text-gray-400">{fmtTime(p.created_at)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{p.bags} bags</div>
                      <div className="text-xs text-gray-400">{p.bags * 25} kg</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ── Current Stock Balance (all types — non-zero only) ──── */}
        <SectionTitle>Current stock balance</SectionTitle>
        <Card className="p-0 overflow-hidden">
          <div className="px-4">
            {nonZeroTypes.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-400">No stock currently available</div>
            ) : (
              <>
                {nonZeroTypes.map(t => (
                  <div key={t} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-semibold text-gray-800">{t}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{stockMap[t]} bags</span>
                      <span className="text-xs text-gray-400 ml-2">{stockMap[t] * 25} kg</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 bg-brand-50 -mx-4 px-4 rounded">
                  <span className="text-sm font-bold text-gray-900">Total available</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-brand-600">{totalStockBags} bags</span>
                    <span className="text-xs text-brand-600 ml-2">{totalStockBags * 25} kg</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* ── Godown-wise stock (only godowns with stock, only types > 0) ── */}
        {godownsWithStock.length > 0 && (
          <>
            <SectionTitle>Stock by godown</SectionTitle>
            {godownsWithStock.map(g => {
              const gStock = godownStock[g] || {};
              const gTypes = types.filter(t => (gStock[t] || 0) > 0);
              const gTotal = gTypes.reduce((s, t) => s + gStock[t], 0);
              return (
                <Card key={g} className="mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-bold text-gray-900">Godown {g}</div>
                    <div className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                      {gTotal} bags total
                    </div>
                  </div>
                  {gTypes.map(t => {
                    const bags = gStock[t];
                    const pct = Math.round((bags / Math.max(gTotal, 1)) * 100);
                    return (
                      <div key={t} className="mb-3 last:mb-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{t}</span>
                          <span className="font-semibold text-gray-900">{bags} bags <span className="text-xs text-gray-400 font-normal">· {bags * 25} kg</span></span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </>
        )}

        {/* ── Sales ─────────────────────────────── */}
        <SectionTitle>Sales</SectionTitle>
        <Card className="p-0 overflow-hidden">
          <div className="px-4">
            {data.sales.length === 0 ? <EmptyState message="No sales today" /> : (
              <>
                {data.sales.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.buyer_name}</div>
                      <div className="text-xs text-gray-400">{s.granule_type} · {s.invoice_number} · {fmtTime(s.created_at)}</div>
                      {s.rate_per_kg > 0 && <div className="text-xs text-gray-400">₹{s.rate_per_kg}/kg</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{s.bags} bags</div>
                      <div className="text-xs text-gray-400">{s.bags * 25} kg</div>
                      {s.total_amount > 0 && <div className="text-xs text-green-600 font-medium">₹{s.total_amount.toLocaleString('en-IN')}</div>}
                    </div>
                  </div>
                ))}
                <Row label="Total sold" value={`${totalSales} bags · ₹${totalRevenue.toLocaleString('en-IN')}`} bold highlight />
              </>
            )}
          </div>
        </Card>

        {/* ── Scrap ─────────────────────────────── */}
        <SectionTitle>Scrap purchases</SectionTitle>
        <Card className="p-0 overflow-hidden">
          <div className="px-4">
            {data.scraps.length === 0 ? <EmptyState message="No purchases today" /> : (
              <>
                {data.scraps.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.seller}</div>
                      <div className="text-xs text-gray-400">{s.vehicle || 'No vehicle'} · {fmtTime(s.created_at)}</div>
                      {s.breakdown && Object.keys(s.breakdown).length > 0 && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {Object.entries(s.breakdown).filter(([,v]) => v > 0).map(([t,v]) => `${t}: ${v}kg`).join(' · ')}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-semibold">{s.total_weight} kg</div>
                  </div>
                ))}
                <Row label="Total scrap in" value={`${totalScrap} kg`} bold highlight />
              </>
            )}
          </div>
        </Card>

        <div className="mt-4 mb-6 text-center text-xs text-gray-300 no-print">
          RecyclePro · {fmtDate(date)}
        </div>
      </div>
    </>
  );
}
