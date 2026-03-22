import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Card, SectionTitle, MetricCard, Badge, Spinner, DatePicker, EmptyState } from '../components/UI';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());

  useEffect(() => {
    setLoading(true);
    api.getDashboard(date).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [date]);

  if (loading) return <Spinner />;
  if (!data) return <EmptyState message="Failed to load dashboard" />;

  const types = data.materialTypes || [];
  const godownNames = data.godownNames || [];

  const godownMap = {};
  (data.prodByGodown || []).forEach(r => { godownMap[r.godown] = r.bags; });

  const shiftMap = { Day: 0, Night: 0 };
  (data.prodByShift || []).forEach(r => { shiftMap[r.shift] = r.bags; });

  const stockMap = data.granuleStock || {};
  const maxStock = Math.max(...Object.values(stockMap), 1);
  const totalStock = Object.values(stockMap).reduce((a, b) => a + b, 0);

  const activityColors = { scrap: 'amber', production: 'blue', sale: 'green' };
  const activityLabels = { scrap: 'Scrap', production: 'Prod', sale: 'Sale' };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Overview</h2>
        <DatePicker value={date} onChange={setDate} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <MetricCard label="Production" value={data.totalProduction} sub="bags today" color="brand" />
        <MetricCard label="Sales" value={data.totalSales} sub="bags today" color="blue" />
        <MetricCard label="Granule stock" value={totalStock} sub="bags total" color="green" />
        <MetricCard label="Revenue today" value={`₹${(data.todayRevenue || 0).toLocaleString('en-IN')}`} sub="" color="amber" />
      </div>

      <SectionTitle>Godown-wise production today</SectionTitle>
      {godownNames.length === 0 ? (
        <Card><EmptyState message="No godowns configured — add them in Settings" /></Card>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {godownNames.map(g => (
            <Card key={g} className="text-center py-3">
              <div className="text-xs text-gray-400 mb-1">{g}</div>
              <div className="text-xl font-semibold text-gray-800">{godownMap[g] || 0}</div>
              <div className="text-xs text-gray-400">bags</div>
            </Card>
          ))}
        </div>
      )}

      <SectionTitle>Shift production today</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {['Day', 'Night'].map(s => (
          <Card key={s} className="text-center py-3">
            <div className="text-xs text-gray-400 mb-1">{s} shift</div>
            <div className="text-xl font-semibold text-gray-800">{shiftMap[s] || 0}</div>
            <div className="text-xs text-gray-400">bags</div>
          </Card>
        ))}
      </div>

      <SectionTitle>Granule stock by type</SectionTitle>
      <Card>
        {types.length === 0 ? (
          <EmptyState message="No material types configured" />
        ) : (
          types.map(t => {
            const val = stockMap[t] || 0;
            const pct = Math.round((val / maxStock) * 100);
            return (
              <div key={t} className="mb-3 last:mb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">{t}</span>
                  <span className="font-semibold text-gray-800">{val} bags</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </Card>

      <SectionTitle>Recent activity</SectionTitle>
      <Card className="px-0 py-0 overflow-hidden">
        {(!data.recentActivity || data.recentActivity.length === 0) ? (
          <EmptyState message="No activity yet today" />
        ) : (
          data.recentActivity.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <Badge color={activityColors[a.type]}>{activityLabels[a.type]}</Badge>
                <div>
                  <div className="text-sm text-gray-800 truncate max-w-[160px]">{a.label}</div>
                  <div className="text-xs text-gray-400">{fmtTime(a.created_at)}</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700 shrink-0">{a.qty} {a.unit}</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
