import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useMaterialTypes } from '../hooks/useMaterialTypes';
import { Card, SectionTitle, Input, Button, Badge, Spinner, EmptyState, ListItem } from '../components/UI';
import toast from 'react-hot-toast';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function ScrapPage() {
  const { types, loading: typesLoading } = useMaterialTypes();
  const [seller, setSeller] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [breakdown, setBreakdown] = useState({});
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadList(); }, []);

  async function loadList() {
    setLoading(true);
    try { setList(await api.getScrap(todayStr())); }
    catch { toast.error('Failed to load scrap list'); }
    finally { setLoading(false); }
  }

  const typeTotal = Object.values(breakdown).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalWeightNum = parseFloat(totalWeight) || 0;

  async function handleSave() {
    if (!seller.trim()) { toast.error('Enter seller name'); return; }
    if (!totalWeight || totalWeightNum <= 0) { toast.error('Enter total weight'); return; }
    setSaving(true);
    try {
      const cleanBreakdown = {};
      types.forEach(t => {
        const v = parseFloat(breakdown[t]) || 0;
        if (v > 0) cleanBreakdown[t] = v;
      });
      await api.addScrap({
        seller: seller.trim(),
        vehicle: vehicle.trim() || null,
        total_weight: totalWeightNum,
        breakdown: cleanBreakdown,
        date: todayStr(),
      });
      toast.success('Scrap purchase saved');
      setSeller(''); setVehicle(''); setTotalWeight(''); setBreakdown({});
      loadList();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await api.deleteScrap(id); toast.success('Deleted'); loadList(); }
    catch { toast.error('Delete failed'); }
  }

  return (
    <div className="fade-in">
      <SectionTitle>New scrap purchase</SectionTitle>
      <Card>
        <Input label="Seller name *" placeholder="e.g. Raju Trading"
          value={seller} onChange={e => setSeller(e.target.value)} />
        <Input label="Vehicle number" placeholder="e.g. MH-12-AB-1234"
          value={vehicle} onChange={e => setVehicle(e.target.value)} />
        <Input label="Total weight (kg) *" type="number" placeholder="0"
          value={totalWeight} onChange={e => setTotalWeight(e.target.value)} />

        {!typesLoading && types.length > 0 && (
          <div className="border-t border-gray-100 my-3 pt-3">
            <div className="text-xs text-gray-500 font-medium mb-3">Type-wise breakdown (kg) — optional</div>
            <div className="grid grid-cols-2 gap-x-3">
              {types.map(t => (
                <Input key={t} label={t} type="number" placeholder="0"
                  value={breakdown[t] || ''}
                  onChange={e => setBreakdown(b => ({ ...b, [t]: e.target.value }))} />
              ))}
            </div>
            {typeTotal > 0 && (
              <div className="text-xs mb-2">
                <span className="text-gray-400">Breakdown total: </span>
                <span className={typeTotal > totalWeightNum && totalWeightNum > 0 ? 'text-red-500 font-medium' : 'font-medium text-gray-700'}>
                  {typeTotal} kg
                </span>
                {totalWeightNum > 0 && Math.abs(typeTotal - totalWeightNum) > 0.01 &&
                  <span className="text-amber-500 ml-2">≠ total weight</span>}
              </div>
            )}
          </div>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save purchase'}
        </Button>
      </Card>

      <SectionTitle>Today's purchases</SectionTitle>
      <Card className="px-0 py-0 overflow-hidden">
        {loading ? <Spinner /> : list.length === 0 ? (
          <EmptyState message="No purchases recorded today" />
        ) : (
          list.map(item => (
            <ListItem key={item.id}
              main={item.seller}
              sub={`${item.vehicle || 'No vehicle'} · ${fmtTime(item.created_at)}`}
              extra={
                item.breakdown && Object.keys(item.breakdown).length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(item.breakdown).filter(([, v]) => v > 0).map(([t, v]) => (
                      <Badge key={t} color="gray">{t}: {v}kg</Badge>
                    ))}
                  </div>
                ) : null
              }
              right={`${item.total_weight} kg`}
              onDelete={() => handleDelete(item.id)}
            />
          ))
        )}
      </Card>
      {list.length > 0 && (
        <div className="mt-2 text-right text-xs text-gray-400 px-1">
          Total today: <span className="font-semibold text-gray-600">
            {list.reduce((s, i) => s + i.total_weight, 0)} kg
          </span>
        </div>
      )}
    </div>
  );
}
