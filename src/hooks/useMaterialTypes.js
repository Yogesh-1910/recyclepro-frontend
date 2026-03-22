import { useState, useEffect } from 'react';
import { api } from '../api';

// ── Material Types ────────────────────────────────────────────────────────────
let mtCache = null;
let mtListeners = [];

export function invalidateMaterialTypes() {
  mtCache = null;
  api.getMaterialTypes()
    .then(rows => { mtCache = rows.map(r => r.name); mtListeners.forEach(fn => fn(mtCache)); })
    .catch(() => {});
}

export function useMaterialTypes() {
  const [types, setTypes] = useState(mtCache || []);
  const [loading, setLoading] = useState(!mtCache);

  useEffect(() => {
    const fn = t => { setTypes(t); setLoading(false); };
    mtListeners.push(fn);
    if (!mtCache) {
      api.getMaterialTypes()
        .then(rows => { mtCache = rows.map(r => r.name); mtListeners.forEach(f => f(mtCache)); })
        .catch(() => setLoading(false));
    } else {
      setTypes(mtCache);
      setLoading(false);
    }
    return () => { mtListeners = mtListeners.filter(l => l !== fn); };
  }, []);

  return { types, loading };
}

// ── Godowns ───────────────────────────────────────────────────────────────────
let gdCache = null;
let gdListeners = [];

export function invalidateGodowns() {
  gdCache = null;
  api.getGodowns()
    .then(rows => { gdCache = rows.map(r => r.name); gdListeners.forEach(fn => fn(gdCache)); })
    .catch(() => {});
}

export function useGodowns() {
  const [godowns, setGodowns] = useState(gdCache || []);
  const [loading, setLoading] = useState(!gdCache);

  useEffect(() => {
    const fn = g => { setGodowns(g); setLoading(false); };
    gdListeners.push(fn);
    if (!gdCache) {
      api.getGodowns()
        .then(rows => { gdCache = rows.map(r => r.name); gdListeners.forEach(f => f(gdCache)); })
        .catch(() => setLoading(false));
    } else {
      setGodowns(gdCache);
      setLoading(false);
    }
    return () => { gdListeners = gdListeners.filter(l => l !== fn); };
  }, []);

  // godowns is always a plain string array e.g. ['A','B','C']
  return { godowns, loading };
}
