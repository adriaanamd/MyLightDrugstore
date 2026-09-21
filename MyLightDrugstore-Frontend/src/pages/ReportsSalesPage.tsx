import { useState, useEffect } from 'react';
import { mockApi } from '../shared/api/client';
import { PageHeader, Button, Card, Table, Th, Td, Tr, Badge, Input, formatPHP, formatDateTime, StatCard, EmptyState } from '../shared/ui';
import type { Sale } from '../shared/api/types';

export default function ReportsSalesPage() {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(weekAgoStr);
  const [toDate, setToDate] = useState(today);
  const [report, setReport] = useState<ReturnType<typeof mockApi.getSalesReport> | null>(null);

  const load = () => {
    try {
      const r = mockApi.getSalesReport({ from: fromDate, to: toDate });
      setReport(r);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, [fromDate, toDate]);

  return (
    <div>
      <PageHeader
        title="Sales Report"
        subtitle="Date-filtered transaction detail and totals"
        action={
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="no-print">
            🖨 Print
          </Button>
        }
      />

      {/* Date filter */}
      <div className="flex items-center gap-3 mb-5 no-print">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="!border-0 !ring-0 !py-0 !px-0 w-36" />
          <span className="text-slate-400 text-xs">to</span>
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="!border-0 !ring-0 !py-0 !px-0 w-36" />
        </div>
        <Button size="sm" onClick={load}>Apply</Button>
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">MyLight Drugstore – Sales Report</h1>
        <p className="text-sm">Period: {fromDate} to {toDate}</p>
        <p className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Sales" value={report.saleCount} color="navy" />
            <StatCard label="Gross Revenue" value={formatPHP(report.totalGross)} color="teal" />
            <StatCard label="Products Sold" value={report.byMedicine.length} />
            <StatCard label="Total Units" value={report.byMedicine.reduce((s, m) => s + m.unitsSold, 0).toLocaleString()} />
          </div>

          {/* By medicine */}
          <Card className="mb-4">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900 text-sm">Sales by Medicine</h2>
            </div>
            {report.byMedicine.length === 0 ? (
              <EmptyState title="No sales in this period" description="Try a different date range." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Generic Name</Th>
                    <Th>Brand</Th>
                    <Th className="text-right">Units Sold</Th>
                    <Th className="text-right">Transactions</Th>
                    <Th className="text-right">Gross Revenue</Th>
                  </tr>
                </thead>
                <tbody>
                  {report.byMedicine.map((m, i) => (
                    <Tr key={i}>
                      <Td><span className="font-medium text-slate-800">{m.genericName}</span></Td>
                      <Td className="text-slate-500">{m.brandName}</Td>
                      <Td className="text-right font-mono font-semibold">{m.unitsSold.toLocaleString()}</Td>
                      <Td className="text-right font-mono text-slate-600">{m.saleCount}</Td>
                      <Td className="text-right font-mono font-bold text-teal-700">{formatPHP(m.gross)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          {/* Sale transactions */}
          <Card>
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900 text-sm">Completed Transactions ({report.sales.length})</h2>
            </div>
            {report.sales.length === 0 ? (
              <EmptyState title="No completed sales in this period" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Sale ID</Th>
                    <Th>Date</Th>
                    <Th>Created By</Th>
                    <Th>Items</Th>
                    <Th className="text-right">Grand Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.map(sale => (
                    <Tr key={sale.id}>
                      <Td><span className="font-mono text-xs text-slate-400">{sale.id}</span></Td>
                      <Td className="text-xs text-slate-600">{formatDateTime(sale.createdAt)}</Td>
                      <Td className="text-xs text-slate-600">{sale.createdByName}</Td>
                      <Td>{sale.items.filter(i => !i.removed).length}</Td>
                      <Td className="text-right font-mono font-semibold">{formatPHP(sale.grandTotal)}</Td>
                    </Tr>
                  ))}
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="px-3 py-2.5 text-slate-700 border-b border-slate-100 font-semibold text-right">TOTAL</td>
                    <Td className="text-right font-mono font-bold text-teal-700 text-base">{formatPHP(report.totalGross)}</Td>
                  </tr>
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
