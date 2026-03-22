import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useMaterialTypes, useGodowns } from '../hooks/useMaterialTypes';
import { Card, SectionTitle, Select, Input, Button, Badge, Spinner, EmptyState, ListItem } from '../components/UI';
import toast from 'react-hot-toast';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function ProductionPage() {
  const { types, loading: typesLoading } = useMaterialTypes();
  const { godowns, loading: godownsLoading } = useGodowns();
  const [godown, setGodown] = useState('');
  const [shift, setShift] = useState('Day');
  const [granuleType, setGranuleType] = useState('');
  const [bags, setBags] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadList(); }, []);
  useEffect(() => { if (types.length > 0 && !granuleType) setGranuleType(types[0]); }, [types]);
  useEffect(() => { if (godowns.length > 0 && !godown) setGodown(godowns[0]); }, [godowns]);

  async function loadList() {
    setLoading(true);
    try { setList(await api.getProduction(todayStr())); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!godown) { toast.error('Select a godown'); return; }
    if (!granuleType) { toast.error('Select a granule type'); return; }
    if (!bags || parseInt(bags) <= 0) { toast.error('Enter number of bags'); return; }
    setSaving(true);
    try {
      await api.addProduction({ godown, shift, granule_type: granuleType, bags: parseInt(bags), date: todayStr() });
      toast.success('Production entry saved');
      setBags('');
      loadList();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
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
      <SectionTitle>Log production</SectionTitle>
      <Card>
        <div className="flex gap-2 mb-3">
          {['Day', 'Night'].map(s => (
            <button key={s} onClick={() => setShift(s)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                shift === s
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}>
              {s} shift
            </button>
          ))}
        </div>

        {notReady ? (
          <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
            {types.length === 0 ? 'No material types' : 'No godowns'} configured. Go to Settings → More menu.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3">
              <Select label="Godown" value={godown} onChange={e => setGodown(e.target.value)}
                options={godowns} />
              <Select label="Granule type" value={granuleType} onChange={e => setGranuleType(e.target.value)}
                options={types} />
            </div>
            <Input label="Number of bags (1 bag = 25 kg)" type="number" placeholder="0"
              value={bags} onChange={e => setBags(e.target.value)} />
            {bags > 0 && (
              <div className="text-xs text-gray-400 -mt-2 mb-3">
                Weight: <span className="font-medium text-gray-600">{parseInt(bags) * 25} kg</span>
              </div>
            )}
          </>
        )}

        <Button onClick={handleSave} disabled={saving || notReady}>
          {saving ? 'Saving...' : 'Save production entry'}
        </Button>
      </Card>

      {list.length > 0 && (
        <>
          <SectionTitle>Today's summary</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
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
        </>
      )}

      <SectionTitle>Today's entries</SectionTitle>
      <Card className="px-0 py-0 overflow-hidden">
        {loading ? <Spinner /> : list.length === 0 ? (
          <EmptyState message="No production entries yet" />
        ) : (
          list.map(item => (
            <ListItem key={item.id}
              main={`${item.godown} · ${item.granule_type}`}
              sub={fmtTime(item.created_at)}
              extra={<Badge color={item.shift === 'Day' ? 'amber' : 'blue'}>{item.shift} shift</Badge>}
              right={`${item.bags} bags`}
              rightSub={`${item.bags * 25} kg`}
              onDelete={() => handleDelete(item.id)}
            />
          ))
        )}
      </Card>
    </div>
  );
}
