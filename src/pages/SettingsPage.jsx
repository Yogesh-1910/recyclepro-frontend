import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Card, SectionTitle, Input, Button, Spinner } from '../components/UI';
import { invalidateMaterialTypes, invalidateGodowns } from '../hooks/useMaterialTypes';
import toast from 'react-hot-toast';

// Reusable editable list for both godowns and material types
function EditableList({ items, onAdd, onRename, onDelete, onMoveUp, onMoveDown, placeholder, emptyMsg }) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  async function handleAdd() {
    if (!newName.trim()) { toast.error('Enter a name'); return; }
    setAdding(true);
    try { await onAdd(newName.trim()); setNewName(''); }
    catch (e) { toast.error(e.message); }
    finally { setAdding(false); }
  }

  async function handleRename(id) {
    if (!editingName.trim()) { toast.error('Enter a name'); return; }
    try { await onRename(id, editingName.trim()); setEditingId(null); }
    catch (e) { toast.error(e.message); }
  }

  return (
    <div>
      {items.length === 0 && (
        <div className="text-center py-3 text-sm text-gray-400">{emptyMsg}</div>
      )}
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
          <div className="flex flex-col gap-0.5 shrink-0">
            <button onClick={() => onMoveUp(idx)} disabled={idx === 0}
              className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs px-0.5 leading-none">▲</button>
            <button onClick={() => onMoveDown(idx)} disabled={idx === items.length - 1}
              className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs px-0.5 leading-none">▼</button>
          </div>

          {editingId === item.id ? (
            <input autoFocus value={editingName}
              onChange={e => setEditingName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(item.id); if (e.key === 'Escape') setEditingId(null); }}
              className="flex-1 border border-brand-500 rounded-lg px-2 py-1 text-sm font-medium bg-white focus:outline-none" />
          ) : (
            <span className="flex-1 text-sm font-semibold text-gray-800">{item.name}</span>
          )}

          <div className="flex gap-1 shrink-0">
            {editingId === item.id ? (
              <>
                <button onClick={() => handleRename(item.id)}
                  className="text-xs px-2 py-1 bg-brand-500 text-white rounded-md hover:bg-brand-600">Save</button>
                <button onClick={() => setEditingId(null)}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-md">Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditingId(item.id); setEditingName(item.name); }}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">Rename</button>
                <button onClick={() => onDelete(item)}
                  className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-md hover:bg-red-100">Delete</button>
              </>
            )}
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-3 border-t border-gray-100 mt-1">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:border-brand-500" />
        <button onClick={handleAdd} disabled={adding}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 whitespace-nowrap">
          {adding ? '...' : '+ Add'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">Names are auto-uppercased. Renaming updates all existing records.</p>
    </div>
  );
}

export default function SettingsPage() {
  const [godowns, setGodowns] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [rates, setRates] = useState({});
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingRates, setSavingRates] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [g, m, r, s] = await Promise.all([
        api.getGodowns(), api.getMaterialTypes(), api.getRates(), api.getSettings()
      ]);
      setGodowns(g);
      setMaterials(m);
      const rmap = {};
      r.forEach(row => { rmap[row.granule_type] = row.rate_per_kg; });
      setRates(rmap);
      setSettings(s);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  }

  // ── Godown handlers ──────────────────────────────────────────────────────
  async function addGodown(name) {
    await api.addGodown({ name });
    toast.success(`Godown "${name.toUpperCase()}" added`);
    load(); invalidateGodowns();
  }
  async function renameGodown(id, name) {
    await api.updateGodown(id, { name });
    toast.success('Godown renamed'); load(); invalidateGodowns();
  }
  async function deleteGodown(g) {
    if (!window.confirm(`Delete godown "${g.name}"?\nCannot delete if it has production records.`)) return;
    try { await api.deleteGodown(g.id); toast.success('Godown deleted'); load(); invalidateGodowns(); }
    catch (e) { toast.error(e.message); }
  }
  async function moveGodown(idx, dir) {
    const a = godowns[idx], b = godowns[idx + dir];
    await Promise.all([
      api.reorderGodown(a.id, { sort_order: b.sort_order }),
      api.reorderGodown(b.id, { sort_order: a.sort_order }),
    ]);
    load(); invalidateGodowns();
  }

  // ── Material type handlers ────────────────────────────────────────────────
  async function addMaterial(name) {
    await api.addMaterialType({ name });
    toast.success(`"${name.toUpperCase()}" added`);
    load(); invalidateMaterialTypes();
  }
  async function renameMaterial(id, name) {
    await api.updateMaterialType(id, { name });
    toast.success('Material type renamed'); load(); invalidateMaterialTypes();
  }
  async function deleteMaterial(m) {
    if (!window.confirm(`Delete "${m.name}"?\nCannot delete if used in any production or sales records.`)) return;
    try { await api.deleteMaterialType(m.id); toast.success('Deleted'); load(); invalidateMaterialTypes(); }
    catch (e) { toast.error(e.message); }
  }
  async function moveMaterial(idx, dir) {
    const a = materials[idx], b = materials[idx + dir];
    await Promise.all([
      api.reorderMaterialType(a.id, { sort_order: b.sort_order }),
      api.reorderMaterialType(b.id, { sort_order: a.sort_order }),
    ]);
    load(); invalidateMaterialTypes();
  }

  async function saveRates() {
    setSavingRates(true);
    try {
      await Promise.all(
        materials.map(m => api.updateRate(m.name, { rate_per_kg: parseFloat(rates[m.name]) || 0 }))
      );
      toast.success('Rates updated');
    } catch { toast.error('Failed to save rates'); }
    finally { setSavingRates(false); }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try { await api.updateSettings(settings); toast.success('Settings saved'); }
    catch { toast.error('Failed to save'); }
    finally { setSavingSettings(false); }
  }

  function setSetting(k, v) { setSettings(s => ({ ...s, [k]: v })); }

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">

      {/* ── Godowns ──────────────────────────────────────────── */}
      <SectionTitle>Godowns</SectionTitle>
      <Card className="mb-2">
        <p className="text-xs text-gray-400 mb-3">
          Add, rename, reorder or remove storage godowns. Used in production entries and inventory.
        </p>
        <EditableList
          items={godowns}
          onAdd={addGodown}
          onRename={renameGodown}
          onDelete={deleteGodown}
          onMoveUp={idx => moveGodown(idx, -1)}
          onMoveDown={idx => moveGodown(idx, 1)}
          placeholder="New godown e.g. MAIN STORE"
          emptyMsg="No godowns yet. Add one below."
        />
      </Card>

      {/* ── Material types ───────────────────────────────────── */}
      <SectionTitle>Material / granule types</SectionTitle>
      <Card className="mb-2">
        <p className="text-xs text-gray-400 mb-3">
          Plastic/granule types used across scrap entry, production, sales, stock and reports.
        </p>
        <EditableList
          items={materials}
          onAdd={addMaterial}
          onRename={renameMaterial}
          onDelete={deleteMaterial}
          onMoveUp={idx => moveMaterial(idx, -1)}
          onMoveDown={idx => moveMaterial(idx, 1)}
          placeholder="New type e.g. HDPE"
          emptyMsg="No material types yet. Add one below."
        />
      </Card>

      {/* ── Rates per kg ─────────────────────────────────────── */}
      <SectionTitle>Granule rates (₹ per kg)</SectionTitle>
      <Card>
        <p className="text-xs text-gray-400 mb-3">
          Default rates. You can override per sale when recording a dispatch.
        </p>
        {materials.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">Add material types above first</p>
        ) : (
          materials.map(m => {
            const rkg = parseFloat(rates[m.name]) || 0;
            return (
              <div key={m.name} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className="w-14 text-sm font-bold text-gray-800">{m.name}</div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                  <input type="number" step="0.01" min="0"
                    value={rates[m.name] != null ? rates[m.name] : ''}
                    onChange={e => setRates(r => ({ ...r, [m.name]: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm bg-white text-gray-900" />
                </div>
                <div className="text-xs text-gray-400 w-24 text-right leading-tight">
                  {rkg > 0 ? (
                    <><span className="font-medium text-gray-600">₹{(rkg * 25).toFixed(0)}</span><br />per bag</>
                  ) : '/kg'}
                </div>
              </div>
            );
          })
        )}
        <div className="mt-3">
          <Button onClick={saveRates} disabled={savingRates || materials.length === 0}>
            {savingRates ? 'Saving...' : 'Update rates'}
          </Button>
        </div>
      </Card>

      {/* ── Company details ───────────────────────────────────── */}
      <SectionTitle>Company details</SectionTitle>
      <Card>
        <Input label="Company name" value={settings.name || ''}
          onChange={e => setSetting('name', e.target.value)} />
        <Input label="GST number" placeholder="27XXXXX..."
          value={settings.gst || ''} onChange={e => setSetting('gst', e.target.value)} />
        <Input label="Phone" value={settings.phone || ''}
          onChange={e => setSetting('phone', e.target.value)} />
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Address</label>
          <textarea rows={2} value={settings.address || ''}
            onChange={e => setSetting('address', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 resize-none" />
        </div>
        <Button onClick={saveSettings} disabled={savingSettings}>
          {savingSettings ? 'Saving...' : 'Save company details'}
        </Button>
      </Card>

      {/* ── Invoice settings ──────────────────────────────────── */}
      <SectionTitle>Invoice settings</SectionTitle>
      <Card>
        <Input label="Invoice number prefix" placeholder="INV"
          value={settings.invoice_prefix || ''} onChange={e => setSetting('invoice_prefix', e.target.value)} />
        <p className="text-xs text-gray-400 -mt-2 mb-3">
          Preview: {settings.invoice_prefix || 'INV'}-0001, {settings.invoice_prefix || 'INV'}-0002...
        </p>
        <Button onClick={saveSettings} disabled={savingSettings}>
          {savingSettings ? 'Saving...' : 'Save invoice settings'}
        </Button>
      </Card>
    </div>
  );
}
