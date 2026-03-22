import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Card, SectionTitle, Badge, Spinner, EmptyState, DatePicker } from '../components/UI';
import toast from 'react-hot-toast';

function fmtTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function InventoryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGodown, setSelectedGodown] = useState(null);
  const [prodHistory, setProdHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => { loadInventory(); }, []);

  async function loadInventory() {
    setLoading(true);
    try {
      const d = await api.getInventory();
      setData(d);
      if (d.godowns.length > 0) {
        setSelectedGodown(g => {
          const first = g || d.godowns[0];
          loadHistory(first, filterDate);
          return first;
        });
      }
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }

  async function loadHistory(godown, date) {
    if (!godown) return;
    setHistoryLoading(true);
    try {
      const h = await api.getGodownProduction(godown, date || undefined);
      setProdHistory(h);
    } catch { setProdHistory([]); }
    finally { setHistoryLoading(false); }
  }

  function selectGodown(g) {
    setSelectedGodown(g);
    loadHistory(g, filterDate);
  }

  function onDateFilter(d) {
    setFilterDate(d);
    if (selectedGodown) loadHistory(selectedGodown, d);
  }

  if (loading) return <Spinner />;
  if (!data) return <EmptyState message="No inventory data" />;

  const { godowns, types, inventory } = data;
  const selectedInv = inventory.find(i => i.godown === selectedGodown);

  // Grand totals — only non-zero types
  const grandTotal = {};
  types.forEach(t => { grandTotal[t] = 0; });
  inventory.forEach(inv => { types.forEach(t => { grandTotal[t] += inv.typeStock[t] || 0; }); });
  const grandTotalBags = Object.values(grandTotal).reduce((a, b) => a + b, 0);
  const nonZeroTypes = types.filter(t => grandTotal[t] > 0);

  return (
    <div className="fade-in">
      <SectionTitle>Total stock — all godowns</SectionTitle>
      <Card className="mb-2">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-brand-50 rounded-xl p-3 text-center">
            <div className="text-xs text-brand-600 opacity-70 mb-1">Total bags</div>
            <div className="text-2xl font-bold text-brand-600">{grandTotalBags}</div>
            <div className="text-xs text-brand-600 opacity-60">{grandTotalBags * 25} kg</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Godowns with stock</div>
            <div className="text-2xl font-bold text-gray-700">{inventory.filter(i => i.totalBags > 0).length}/{godowns.length}</div>
            <div className="text-xs text-gray-400">active</div>
          </div>
        </div>
        {nonZeroTypes.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-2">No stock in any godown</div>
        ) : nonZeroTypes.map(t => {
          const pct = Math.round((grandTotal[t] / Math.max(grandTotalBags, 1)) * 100);
          return (
            <div key={t} className="mb-3 last:mb-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-800">{t}</span>
                <span className="font-bold text-gray-900">{grandTotal[t]} bags <span className="text-xs font-normal text-gray-400">· {grandTotal[t] * 25} kg</span></span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </Card>

      {/* Godown selector */}
      <SectionTitle>Select godown to inspect</SectionTitle>
      <div className="flex gap-2 overflow-x-auto pb-1 mb-1">
        {godowns.map(g => {
          const inv = inventory.find(i => i.godown === g);
          const active = selectedGodown === g;
          const hasSock = (inv?.totalBags || 0) > 0;
          return (
            <button key={g} onClick={() => selectGodown(g)}
              className={`flex-shrink-0 rounded-2xl px-4 py-3 text-center border transition-all min-w-[90px] ${
                active ? 'bg-brand-500 text-white border-brand-500 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
              }`}>
              <div className={`text-[10px] font-medium mb-0.5 ${active ? 'text-white opacity-70' : 'text-gray-400'}`}>Godown</div>
              <div className="text-lg font-bold leading-none">{g}</div>
              <div className={`text-xs mt-1.5 font-medium ${active ? 'text-white opacity-80' : hasSock ? 'text-brand-500' : 'text-gray-300'}`}>
                {inv?.totalBags || 0} bags
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected godown stock detail */}
      {selectedGodown && selectedInv && (
        <>
          <SectionTitle>Godown {selectedGodown} — available stock</SectionTitle>
          <Card>
            {types.filter(t => (selectedInv.typeStock[t] || 0) > 0).length === 0 ? (
              <EmptyState message={`Godown ${selectedGodown} is empty`} />
            ) : (
              <>
                {/* Only show types with stock > 0 */}
                {types.filter(t => (selectedInv.typeStock[t] || 0) > 0).map(t => {
                  const bags = selectedInv.typeStock[t];
                  const pct = Math.round((bags / Math.max(selectedInv.totalBags, 1)) * 100);
                  return (
                    <div key={t} className="mb-5 last:mb-0">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{t}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium">{pct}%</span>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-gray-900">{bags} bags</div>
                          <div className="text-xs text-gray-400">{bags * 25} kg</div>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-gray-100">
                  <span className="text-sm font-bold text-gray-700">Total in Godown {selectedGodown}</span>
                  <div className="text-right">
                    <span className="text-base font-bold text-brand-600">{selectedInv.totalBags} bags</span>
                    <span className="text-sm text-gray-400 ml-2">({selectedInv.totalKg} kg)</span>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Production history for this godown */}
          <SectionTitle>Production history — Godown {selectedGodown}</SectionTitle>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-gray-400 shrink-0">Filter by date:</span>
            <DatePicker value={filterDate} onChange={onDateFilter} />
            {filterDate && (
              <button onClick={() => onDateFilter('')} className="text-xs text-red-400 hover:text-red-600 underline">
                Clear filter
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">{prodHistory.length} entries</span>
          </div>
          <Card className="px-0 py-0 overflow-hidden">
            {historyLoading ? <Spinner /> : prodHistory.length === 0 ? (
              <EmptyState message={filterDate ? `No production on this date for Godown ${selectedGodown}` : `No production recorded yet for Godown ${selectedGodown}`} />
            ) : (
              prodHistory.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{p.granule_type}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge color={p.shift === 'Day' ? 'amber' : 'blue'}>{p.shift}</Badge>
                      <span className="text-xs text-gray-400">{fmtDate(p.date)}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{fmtTime(p.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <div className="text-sm font-bold text-gray-900">{p.bags} bags</div>
                    <div className="text-xs text-gray-400">{p.bags * 25} kg</div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </>
      )}

      {godowns.length === 0 && (
        <Card>
          <div className="text-center py-4">
            <div className="text-sm text-gray-500 mb-2">No godowns configured yet.</div>
            <div className="text-xs text-gray-400">Go to Settings → Godowns to add and name your godowns.</div>
          </div>
        </Card>
      )}
    </div>
  );
}
