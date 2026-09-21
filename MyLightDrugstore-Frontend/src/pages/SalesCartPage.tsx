import { useState, useEffect } from 'react';
import { useNavigate, Link } from '../shared/router-compat';
import { mockApi } from '../shared/api/client';
import type { Sale, SaleItem } from '../shared/api/types';
import { MockApiError } from '../shared/api/types';
import { PageHeader, Button, Card, Badge, Table, Th, Td, Tr, Modal, Select, ConfirmDialog, ErrorBanner, showToast, formatPHP, formatDateTime, EmptyState } from '../shared/ui';

export default function SalesCartPage() {
  const navigate = useNavigate();
  const [sale, setSale] = useState<Sale | null>(null);
  const [error, setError] = useState('');

  const [removeItem, setRemoveItem] = useState<SaleItem | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const [paying, setPaying] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('entered_in_error');
  const [cancelLoading, setCancelLoading] = useState(false);

  const load = () => {
    try {
      const db = mockApi.getDb();
      const open = db.sales.find(s => s.state === 'open');
      setSale(open ?? null);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = () => {
    if (!sale || !removeItem) return;
    setRemoveLoading(true);
    try {
      const updated = mockApi.removeSaleItem(sale.id, removeItem.id);
      setSale(updated);
      setRemoveItem(null);
      showToast('Item removed and stock restored.');
    } catch (e) {
      if (e instanceof MockApiError) setError(e.apiError.message);
    } finally {
      setRemoveLoading(false);
    }
  };

  const handlePay = () => {
    if (!sale) return;
    setPayLoading(true);
    try {
      const updated = mockApi.markSalePaid(sale.id);
      setSale(updated);
      setPaying(false);
      showToast('Sale marked as paid and completed.');
    } catch (e) {
      if (e instanceof MockApiError) setError(e.apiError.message);
    } finally {
      setPayLoading(false);
    }
  };

  const handleCancel = () => {
    if (!sale) return;
    setCancelLoading(true);
    try {
      mockApi.cancelSale(sale.id, cancelReason);
      setCancelling(false);
      showToast('Sale cancelled and stock restored.', 'info');
      setSale(null);
    } catch (e) {
      if (e instanceof MockApiError) setError(e.apiError.message);
    } finally {
      setCancelLoading(false);
    }
  };

  if (!sale || sale.state !== 'open') {
    return (
      <div>
        <PageHeader title="Open Cart" />
        <Card className="p-8">
          {sale && sale.state !== 'open' ? (
            <div className="text-center">
              <div className="text-4xl mb-3">
                {sale.state === 'completed' ? '✅' : '❌'}
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Sale {sale.state === 'completed' ? 'Completed' : 'Cancelled'}
              </h3>
              <p className="text-sm text-slate-500 mb-4">This sale has been {sale.state}.</p>
              <Link to="/sales/new"><Button>Start New Sale</Button></Link>
            </div>
          ) : (
            <EmptyState
              title="No open sale"
              description="Start a new sale to add items to the cart."
              action={<Link to="/sales/new"><Button>New Sale</Button></Link>}
            />
          )}
        </Card>
      </div>
    );
  }

  const activeItems = sale.items.filter(i => !i.removed);
  const removedItems = sale.items.filter(i => i.removed);

  return (
    <div>
      <PageHeader
        title="Open Cart"
        subtitle={`Sale ${sale.id} · Started ${formatDateTime(sale.createdAt)}`}
        action={
          <div className="flex gap-2">
            <Link to="/sales/new"><Button variant="outline" size="sm">+ Add Item</Button></Link>
            <Link to={`/sales/print/${sale.id}`} target="_blank"><Button variant="ghost" size="sm">🖨 Print Order</Button></Link>
            <Button variant="outline" size="sm" onClick={() => setCancelling(true)} className="text-red-600 border-red-200 hover:bg-red-50">Cancel Sale</Button>
            <Button size="sm" onClick={() => setPaying(true)}>Mark Paid</Button>
          </div>
        }
      />

      {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm">Cart Items ({activeItems.length})</h2>
              <Badge variant="amber">Unpaid</Badge>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Medicine</Th>
                  <Th>Form / Strength</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Unit Price</Th>
                  <Th className="text-right">Line Total</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {activeItems.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-sm text-slate-400">Cart is empty — <Link to="/sales/new" className="text-teal-600 hover:underline">add items</Link></td></tr>
                )}
                {activeItems.map(item => (
                  <Tr key={item.id}>
                    <Td>
                      <div>
                        <p className="font-medium text-slate-800">{item.genericName}</p>
                        <p className="text-xs text-slate-400">{item.brandName}</p>
                      </div>
                    </Td>
                    <Td className="text-xs text-slate-500">{item.dosageForm} · {item.strength}</Td>
                    <Td className="text-right font-mono font-medium">{item.quantity}</Td>
                    <Td className="text-right font-mono text-sm">{formatPHP(item.unitPrice)}</Td>
                    <Td className="text-right font-mono font-semibold text-slate-800">{formatPHP(item.lineTotal)}</Td>
                    <Td>
                      <button
                        onClick={() => setRemoveItem(item)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>

            {removedItems.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 mb-2">Removed items (kept for audit)</p>
                {removedItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-xs text-slate-400 line-through py-1">
                    <span>{item.genericName}</span>
                    <span>×{item.quantity}</span>
                    <span>{formatPHP(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Order summary */}
        <div>
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Items</span>
                <span>{activeItems.length}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Units</span>
                <span>{activeItems.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-slate-900">
                <span>Grand Total</span>
                <span className="font-mono text-lg">{formatPHP(sale.grandTotal)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => setPaying(true)} disabled={activeItems.length === 0}>
                ✓ Mark Paid
              </Button>
              <Link to="/sales/new" className="block">
                <Button variant="outline" className="w-full">+ Add Another Item</Button>
              </Link>
              <Link to={`/sales/print/${sale.id}`} target="_blank" className="block">
                <Button variant="ghost" className="w-full">🖨 Print Order</Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4 mt-3">
            <div className="text-xs text-slate-500 space-y-1">
              <p><strong className="text-slate-700">Sale ID:</strong> <span className="font-mono">{sale.id}</span></p>
              <p><strong className="text-slate-700">Created by:</strong> {sale.createdByName}</p>
              <p><strong className="text-slate-700">Started:</strong> {formatDateTime(sale.createdAt)}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Remove confirm */}
      <ConfirmDialog
        open={!!removeItem}
        onClose={() => setRemoveItem(null)}
        onConfirm={handleRemove}
        title="Remove Item"
        message={`Remove ${removeItem?.genericName} (×${removeItem?.quantity}) from the cart? Stock will be restored.`}
        confirmLabel="Remove"
        loading={removeLoading}
      />

      {/* Mark paid confirm */}
      <ConfirmDialog
        open={paying}
        onClose={() => setPaying(false)}
        onConfirm={handlePay}
        title="Mark Sale as Paid"
        message={`Mark this sale as paid and completed? Grand total: ${formatPHP(sale.grandTotal)}. This action cannot be undone.`}
        confirmLabel="Mark Paid"
        variant="primary"
        loading={payLoading}
      />

      {/* Cancel sale modal */}
      <Modal open={cancelling} onClose={() => setCancelling(false)} title="Cancel Sale" size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setCancelling(false)}>Back</Button>
          <Button variant="danger" onClick={handleCancel} loading={cancelLoading}>Cancel Sale</Button>
        </>}
      >
        <p className="text-sm text-slate-600 mb-4">Cancel this sale? All stock will be restored. This action cannot be undone.</p>
        <Select
          label="Reason for cancellation"
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
        >
          <option value="entered_in_error">Entered in error</option>
          <option value="customer_changed_mind">Customer changed mind</option>
          <option value="out_of_stock">Out of stock</option>
          <option value="other">Other</option>
        </Select>
      </Modal>
    </div>
  );
}
