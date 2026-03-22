import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import ScrapPage from './pages/ScrapPage';
import ProductionPage from './pages/ProductionPage';
import SalesPage from './pages/SalesPage';
import ReportPage from './pages/ReportPage';
import InventoryPage from './pages/InventoryPage';
import BuyersPage from './pages/BuyersPage';
import SettingsPage from './pages/SettingsPage';

const TABS = [
  { id: 'dashboard', label: 'Dash', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { id: 'production', label: 'Produce', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
    </svg>
  )},
  { id: 'inventory', label: 'Stock', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { id: 'sales', label: 'Sales', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M13 3h8m0 0v8m0-8L11 13"/>
    </svg>
  )},
  { id: 'report', label: 'Report', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )},
];

const MORE_TABS = [
  { id: 'scrap', label: 'Scrap purchases' },
  { id: 'buyers', label: 'Buyers' },
  { id: 'settings', label: 'Settings / Rates' },
];

const PAGE_LABELS = { scrap: 'Scrap', buyers: 'Buyers', settings: 'Settings', inventory: 'Inventory' };

const PAGES = {
  dashboard: Dashboard, scrap: ScrapPage, production: ProductionPage,
  sales: SalesPage, report: ReportPage, inventory: InventoryPage,
  buyers: BuyersPage, settings: SettingsPage,
};

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [moreOpen, setMoreOpen] = useState(false);
  const Page = PAGES[active];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" toastOptions={{ duration: 2500, style: { fontSize: '13px', maxWidth: '320px' } }} />

      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between max-w-lg mx-auto no-print">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 019-9"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-800">RecyclePro</span>
          {PAGE_LABELS[active] && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{PAGE_LABELS[active]}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <div className="relative">
            <button onClick={() => setMoreOpen(o => !o)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[180px] overflow-hidden">
                {MORE_TABS.map(t => (
                  <button key={t.id} onClick={() => { setActive(t.id); setMoreOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${active === t.id ? 'text-brand-600 font-medium bg-brand-50' : 'text-gray-700'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {moreOpen && <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />}

      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        <Page />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 no-print">
        <div className="max-w-lg mx-auto flex">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActive(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors ${
                active === tab.id ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
