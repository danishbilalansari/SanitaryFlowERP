import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { Download, ShoppingCart, Truck, Package, ChevronRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../store';
import { TableSkeletonRows, GlassEmptyState, GlassPagination } from '../components/GlassUI';

export default function RawMaterials() {
  const { showToast, currency } = useAppContext();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetch('/api/inventory')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => {
        // Filter for items that likely are raw materials 
        // (You could use a specific category if programmed in the DB)
        const filtered = data.filter((item: any) => 
          (item.category || '').toLowerCase().includes('raw') || 
          ['powder', 'compound', 'fittings', 'kaolin', 'glaze'].some(token => item.name.toLowerCase().includes(token))
        );
        setInventory(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const lowStockCount = inventory.filter(item => item.stock < item.minStock).length;

  const handleExport = () => {
    if (!inventory || inventory.length === 0) {
      showToast?.('No raw materials data to export', 'error');
      return;
    }

    const headers = ['Material Name', 'Category', 'SKU', 'Current Stock', 'Min Threshold', 'Status'];
    const rows = inventory.map(item => [
      item.name,
      item.category,
      item.sku,
      item.stock,
      item.minStock,
      item.stock < item.minStock ? 'Critical' : 'Stable'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Raw_Materials_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Raw materials report exported successfully', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/inventory" className="hover:text-[#0284c7] transition-colors">Inventory</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0284c7] font-bold">Raw Materials</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">Raw Materials</h2>
          <p className="text-sm text-slate-600">Management of base components and production supplies.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={handleExport}
            className="px-5 py-2.5 glass-pill-button text-slate-800 flex items-center gap-2 font-semibold text-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <Link to="/purchases/add" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white hover:brightness-105 transition-all flex items-center gap-2 font-semibold text-xs shadow-[0_4px_16px_rgba(2,132,199,0.3)]">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Order Materials</span>
          </Link>
        </div>
      </div>

      {/* Simplified KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 bg-sky-50 border border-white rounded-2xl flex items-center justify-center shadow-2xs">
              <Package className="w-5 h-5 text-[#0284c7]" />
            </div>
            <span className="text-[11px] text-[#0284c7] font-semibold bg-sky-50/90 border border-sky-200/80 px-3 py-0.5 rounded-full">Tracked Items</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1">Raw Material SKUs</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">{inventory.length} <span className="text-sm font-medium text-slate-400">Categories</span></h3>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 bg-rose-50 border border-white rounded-2xl flex items-center justify-center shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <span className="text-[11px] text-rose-600 font-semibold bg-rose-50/90 border border-rose-200/80 px-3 py-0.5 rounded-full">Critical Alerts</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-rose-500 uppercase tracking-[0.08em] mb-1">Low Stock Materials</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">{lowStockCount} <span className="text-sm font-medium text-slate-400">Items</span></h3>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="glass-table-container">
        <div className="p-5 sm:p-6 border-b border-white/90 flex justify-between items-center bg-white/[0.45] backdrop-blur-xl">
          <div>
            <h4 className="text-[17px] font-bold text-slate-900 tracking-tight">Material Inventory List</h4>
            <p className="text-xs text-slate-500 mt-0.5">Live balance of raw compounds, powders, and glazes</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-4">Material Info</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-right">Current Stock</th>
                <th className="px-6 py-4 text-right">Min Threshold</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-[13.5px]">
              {loading ? (
                <TableSkeletonRows columns={5} rows={5} />
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <GlassEmptyState
                      title="No raw materials found"
                      description="Raw compounds, glazes, and production supplies will appear here once added."
                    />
                  </td>
                </tr>
              ) : (
                inventory
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs font-semibold">{item.sku}</td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-900 tabular-nums">{item.stock.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-slate-500 tabular-nums">{item.minStock.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-semibold border ${
                          item.stock < item.minStock ? 'bg-rose-50/90 text-rose-700 border-rose-200/80' : 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80'
                        }`}>
                          {item.stock < item.minStock ? 'Critical' : 'Stable'}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <GlassPagination
          currentPage={currentPage}
          totalPages={Math.ceil(inventory.length / itemsPerPage)}
          totalItems={inventory.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="materials"
        />
      </div>
    </div>
  );
}
