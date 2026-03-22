import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Spinner } from '../components/UI';
import toast from 'react-hot-toast';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InvoicePage({ saleId, onClose }) {
  const [sale, setSale] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getSale(saleId), api.getSettings()])
      .then(([s, st]) => { setSale(s); setSettings(st); })
      .catch(() => toast.error('Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [saleId]);

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8"><Spinner /></div>
    </div>
  );

  if (!sale) return null;

  const weightKg = sale.bags * 25;
  const ratePerKg = sale.rate_per_kg || 0;
  const ratePerBag = ratePerKg * 25;
  const totalAmount = sale.total_amount || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-auto py-6 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">

        {/* Action bar — hidden on print */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 no-print">
          <span className="text-sm font-semibold text-gray-700">Invoice preview</span>
          <div className="flex gap-2">
            <button onClick={() => window.print()}
              className="text-sm px-4 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium">
              Print / Save PDF
            </button>
            <button onClick={onClose}
              className="text-sm px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
              Close
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div id="invoice-content" className="p-6">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-base font-bold text-gray-900">{settings.name || 'Company Name'}</div>
              {settings.gst && <div className="text-xs text-gray-500 mt-0.5">GST: {settings.gst}</div>}
              {settings.phone && <div className="text-xs text-gray-500">{settings.phone}</div>}
              {settings.address && (
                <div className="text-xs text-gray-500 mt-1 max-w-[180px] leading-relaxed">{settings.address}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-brand-500">INVOICE</div>
              <div className="text-sm font-semibold text-gray-700 mt-1">{sale.invoice_number}</div>
              <div className="text-xs text-gray-400 mt-0.5">{fmtDate(sale.date)}</div>
            </div>
          </div>

          {/* Bill to */}
          <div className="bg-gray-50 rounded-xl p-3 mb-5">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">Bill to</div>
            <div className="text-sm font-semibold text-gray-900">{sale.buyer_name}</div>
            {sale.gst_number && <div className="text-xs text-gray-500">GST: {sale.gst_number}</div>}
            {sale.vehicle && <div className="text-xs text-gray-500">Vehicle: {sale.vehicle}</div>}
            {sale.godown && <div className="text-xs text-gray-500">Dispatched from: {sale.godown}</div>}
          </div>

          {/* Items table */}
          <table className="w-full text-sm mb-5 border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left text-xs text-gray-500 font-semibold pb-2 w-2/5">Item</th>
                <th className="text-right text-xs text-gray-500 font-semibold pb-2">Bags</th>
                <th className="text-right text-xs text-gray-500 font-semibold pb-2">Kg</th>
                <th className="text-right text-xs text-gray-500 font-semibold pb-2">₹/kg</th>
                <th className="text-right text-xs text-gray-500 font-semibold pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3">
                  <div className="font-medium text-gray-900">{sale.granule_type} Granules</div>
                  <div className="text-xs text-gray-400">Recycled plastic</div>
                </td>
                <td className="py-3 text-right text-gray-700">{sale.bags}</td>
                <td className="py-3 text-right text-gray-700">{weightKg}</td>
                <td className="py-3 text-right text-gray-700">
                  {ratePerKg > 0 ? `₹${ratePerKg}` : '—'}
                </td>
                <td className="py-3 text-right font-semibold text-gray-900">
                  {totalAmount > 0 ? `₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <div className="border-t-2 border-gray-200 pt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Total weight</span>
              <span>{weightKg} kg ({sale.bags} bags × 25 kg)</span>
            </div>
            {ratePerBag > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Rate per bag</span>
                <span>₹{ratePerBag.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 mt-2 pt-2 border-t border-gray-200">
              <span>Total Amount</span>
              <span className="text-brand-600">
                {totalAmount > 0
                  ? `₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                  : 'Rate not set'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-dashed border-gray-200 text-center">
            <div className="text-xs text-gray-400">Thank you for your business</div>
            <div className="text-xs text-gray-300 mt-1">Generated by RecyclePro</div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-content, #invoice-content * { visibility: visible !important; }
          #invoice-content {
            position: fixed; top: 0; left: 0; width: 100%; padding: 24px;
            background: white;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
