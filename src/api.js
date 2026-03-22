const BASE = '/api';
async function req(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export const api = {
  getDashboard:        (date)       => req('GET',    `/dashboard${date?`?date=${date}`:''}`),
  getScrap:            (date)       => req('GET',    `/scrap${date?`?date=${date}`:''}`),
  addScrap:            (body)       => req('POST',   '/scrap', body),
  deleteScrap:         (id)         => req('DELETE', `/scrap/${id}`),
  getProduction:       (date)       => req('GET',    `/production${date?`?date=${date}`:''}`),
  addProduction:       (body)       => req('POST',   '/production', body),
  deleteProduction:    (id)         => req('DELETE', `/production/${id}`),
  getSales:            (date)       => req('GET',    `/sales${date?`?date=${date}`:''}`),
  getSale:             (id)         => req('GET',    `/sales/${id}`),
  getStock:            ()           => req('GET',    '/sales/stock'),
  addSale:             (body)       => req('POST',   '/sales', body),
  deleteSale:          (id)         => req('DELETE', `/sales/${id}`),
  getBuyers:           ()           => req('GET',    '/buyers'),
  addBuyer:            (body)       => req('POST',   '/buyers', body),
  updateBuyer:         (id, body)   => req('PUT',    `/buyers/${id}`, body),
  deleteBuyer:         (id)         => req('DELETE', `/buyers/${id}`),
  getRates:            ()           => req('GET',    '/rates'),
  updateRate:          (type, body) => req('PUT',    `/rates/${type}`, body),
  getSettings:         ()           => req('GET',    '/settings'),
  updateSettings:      (body)       => req('PUT',    '/settings', body),
  getReport:           (date)       => req('GET',    `/report${date?`?date=${date}`:''}`),
  getMaterialTypes:    ()           => req('GET',    '/material-types'),
  addMaterialType:     (body)       => req('POST',   '/material-types', body),
  updateMaterialType:  (id, body)   => req('PUT',    `/material-types/${id}`, body),
  deleteMaterialType:  (id)         => req('DELETE', `/material-types/${id}`),
  reorderMaterialType: (id, body)   => req('PUT',    `/material-types/${id}/reorder`, body),
  getGodowns:          ()           => req('GET',    '/godowns'),
  addGodown:           (body)       => req('POST',   '/godowns', body),
  updateGodown:        (id, body)   => req('PUT',    `/godowns/${id}`, body),
  deleteGodown:        (id)         => req('DELETE', `/godowns/${id}`),
  reorderGodown:       (id, body)   => req('PUT',    `/godowns/${id}/reorder`, body),
  getInventory:        ()           => req('GET',    '/inventory'),
  getGodownProduction: (g, date)    => req('GET',    `/inventory/${encodeURIComponent(g)}/production${date?`?date=${date}`:''}`),
};
