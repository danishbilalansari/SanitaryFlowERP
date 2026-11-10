import React, { useEffect, useState } from 'react';
import { UserPlus, ShoppingCart, Banknote, Package, BarChart3, AlertTriangle, ArrowRight, PackageOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardSkeleton, TableSkeletonRows, GlassEmptyState } from '../components/GlassUI';
import { cachedJsonFetch } from '../lib/apiCache';

interface DashboardData {
  dailyRevenue: number;
  unitsSold: number;
  avgTransaction: number;
  topProducts: { name: string; total_qty: number }[];
  todayTransactions: any[];
  stockAlerts: any[];
}

export default function ShopDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      cachedJsonFetch<DashboardData>('/api/shop/dashboard', { credentials: 'include' }, 30_000),
      cachedJsonFetch<any[]>('/api/inventory?category=Shop', { credentials: 'include' }, 30_000)
    ])
      .then(([dashData, items]) => {
        setData(dashData || {
          dailyRevenue: 0,
          unitsSold: 0,
          avgTransaction: 0,
          topProducts: [],
          todayTransactions: [],
          stockAlerts: []
        });
        setInventory(Array.isArray(items) ? items : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) return <DashboardSkeleton />;

  const totalDisplay = inventory.reduce((acc, item) => acc + (item.display_stock || 0), 0);
  const totalWarehouse = inventory.reduce((acc, item) => acc + (item.warehouse_stock || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-slate-400 mb-2">
            <Link to="/inventory" className="hover:text-[#0284c7] transition-colors">Inventory</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#0284c7] font-bold">Shop Inventory</span>
          </nav>
          <h2 className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">Shop Inventory</h2>
          <p className="text-[15px] text-slate-500 mt-1">Management of display and warehouse stock for the branch.</p>
        </div>
      </div>

      {/* KPI Stats - Simplified to just Display & Warehouse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-6 rounded-[28px] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 bg-white/95 border border-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
              <Package className="w-5 h-5 text-[#0284c7]" />
            </div>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50/90 border border-emerald-200/80 px-3 py-1 rounded-full uppercase tracking-wider">ACTIVE DISPLAY</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL DISPLAY STOCK</p>
            <h3 className="text-[32px] font-bold text-slate-900 tracking-tight">{totalDisplay.toLocaleString()} <span className="text-[16px] font-normal text-slate-500">Items</span></h3>
          </div>
        </div>

        <div className="glass-card p-6 rounded-[28px] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 bg-white/95 border border-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
              <PackageOpen className="w-5 h-5 text-[#0284c7]" />
            </div>
            <span className="text-[11px] text-[#0284c7] font-bold bg-sky-50/90 border border-sky-200/80 px-3 py-1 rounded-full uppercase tracking-wider">BACKROOM STOCK</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL WAREHOUSE STOCK</p>
            <h3 className="text-[32px] font-bold text-slate-900 tracking-tight">{totalWarehouse.toLocaleString()} <span className="text-[16px] font-normal text-slate-500">Items</span></h3>
          </div>
        </div>
      </div>

      {/* Stock Alerts & Table Section */}
      <div className="space-y-6">
        {data.stockAlerts.length > 0 && (
          <div className="bg-red-50/90 border border-red-200/80 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500 w-5 h-5" />
              <p className="text-[14px] font-medium text-red-800">
                <span className="font-bold">{data.stockAlerts.length} items</span> are below minimum threshold in the shop.
              </p>
            </div>
          </div>
        )}

        <div className="glass-table-container overflow-hidden">
          <div className="p-6 border-b border-slate-200/60 flex justify-between items-center bg-white/40">
            <h4 className="text-[20px] font-bold text-slate-900">Display & Warehouse Stock</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4 text-right">Display Stock</th>
                  <th className="px-6 py-4 text-right">Display Status</th>
                  <th className="px-6 py-4 text-right">Warehouse Stock</th>
                  <th className="px-6 py-4 text-right">Warehouse Status</th>
                </tr>
              </thead>
              <tbody className="text-[14px] divide-y divide-slate-200/50">
                {loading ? (
                  <TableSkeletonRows columns={6} rows={5} />
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <GlassEmptyState
                        title="No shop inventory items"
                        description="Display and warehouse stock allocated to the shop will appear here."
                      />
                    </td>
                  </tr>
                ) : inventory.map((item) => (
                  <tr key={item.id} className="transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[12px] text-slate-500">{item.category}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[13px]">{item.sku}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">{item.display_stock?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        (item.display_stock || 0) < (item.minStock || 0) ? 'bg-red-50/90 text-red-600 border-red-200/80' : 'bg-emerald-50/90 text-emerald-600 border-emerald-200/80'
                      }`}>
                        {(item.display_stock || 0) < (item.minStock || 0) ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">{item.warehouse_stock?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        (item.warehouse_stock || 0) < (item.minStock || 0) ? 'bg-red-50/90 text-red-600 border-red-200/80' : 'bg-emerald-50/90 text-emerald-600 border-emerald-200/80'
                      }`}>
                        {(item.warehouse_stock || 0) < (item.minStock || 0) ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
