import { useState, useEffect } from 'react';
import { useParams } from '../shared/router-compat';
import { mockApi } from '../shared/api/client';
import type { Sale } from '../shared/api/types';
import { formatPHP, formatDateTime } from '../shared/ui';

export default function SalesPrintPage() {
  const { saleId } = useParams<{ saleId: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (saleId) setSale(mockApi.getSale(saleId));
    } catch { setError('Sale not found.'); }
  }, [saleId]);

  const activeItems = sale?.items.filter(i => !i.removed) ?? [];

  return (
    <div className="min-h-screen bg-white p-8 max-w-lg mx-auto">
      <div className="no-print flex gap-2 mb-6">
        <button
          onClick={() => window.print()}
          className="bg-navy-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy-800 transition-colors"
        >
          🖨 Print
        </button>
        <button
          onClick={() => window.close()}
          className="border border-slate-300 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {sale && (
        <div className="print-area">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a1 1 0 011 1v3h3a1 1 0 010 2h-3v3a1 1 0 01-2 0V8H8a1 1 0 010-2h3V3a1 1 0 011-1zM4 14a8 8 0 1016 0H4z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">MyLight Drugstore</h1>
            <p className="text-sm text-slate-500">Official Sales Receipt</p>
          </div>

          {/* Sale info */}
          <div className="border border-slate-200 rounded-lg p-4 mb-5 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Sale ID</span>
              <span className="font-mono font-medium">{sale.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date / Time</span>
              <span>{formatDateTime(sale.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Served by</span>
              <span>{sale.createdByName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={`font-medium capitalize ${sale.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {sale.paymentStatus === 'paid' ? '✓ PAID' : 'UNPAID'}
              </span>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-sm mb-5">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="text-left py-2 font-semibold">Medicine</th>
                <th className="text-right py-2 font-semibold">Qty</th>
                <th className="text-right py-2 font-semibold">Price</th>
                <th className="text-right py-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map(item => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2">
                    <p className="font-medium">{item.genericName}</p>
                    <p className="text-xs text-slate-500">{item.brandName} · {item.strength}</p>
                  </td>
                  <td className="text-right py-2 font-mono">{item.quantity}</td>
                  <td className="text-right py-2 font-mono">{formatPHP(item.unitPrice)}</td>
                  <td className="text-right py-2 font-mono font-semibold">{formatPHP(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-center">
            <span className="text-lg font-semibold">GRAND TOTAL</span>
            <span className="font-mono text-2xl font-bold">{formatPHP(sale.grandTotal)}</span>
          </div>

          {sale.paymentStatus === 'paid' && sale.completedAt && (
            <div className="mt-4 text-center">
              <div className="inline-block border-2 border-emerald-600 text-emerald-600 font-bold text-xl px-6 py-2 rounded transform rotate-[-3deg]">
                PAID
              </div>
              <p className="text-xs text-slate-400 mt-2">{formatDateTime(sale.completedAt)}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-200 pt-4">
            <p>Thank you for your purchase.</p>
            <p className="mt-1">MyLight Drugstore · Pharmacy Management System</p>
            <p className="mt-1">This is a demo receipt. No real transaction has occurred.</p>
          </div>
        </div>
      )}
    </div>
  );
}
