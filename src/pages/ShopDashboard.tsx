import React, { useEffect, useState } from 'react';
import { UserPlus, ShoppingCart, Banknote, Package, BarChart3, AlertTriangle, ArrowRight, PackageOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    // Fetch dashboard stats
    fetch('/api/shop/dashboard', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) throw new Error('Dashboard fetch failed');
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      })
      .then(d => setData(d))
      .catch(console.error);
    
    // Fetch full shop inventory items
    fetch('/api/inventory?category=Shop', { credentials: 'include' }) // Assuming shop items are filtered
      .then(async res => {
        if (!res.ok) throw new Error('Inventory fetch failed');
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(items => {
        setInventory(items);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (!data) return <div className="p-8">Loading dashboard...</div>;

  const totalDisplay = inventory.reduce((acc, item) => acc + (item.display_stock || 0), 0);
  const totalWarehouse = inventory.reduce((acc, item) => acc + (item.warehouse_stock || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/inventory" className="hover:text-[#006397] transition-colors">Inventory</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Shop Inventory</span>
          </nav>
          <h2 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">Shop Inventory</h2>
          <p className="text-[16px] text-neutral-500 mt-1">Management of display and warehouse stock for the branch.</p>
        </div>
      </div>

      {/* KPI Stats - Simplified to just Display & Warehouse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#edeeef] p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#d1e4fb] rounded-lg">
              <Package className="w-5 h-5 text-[#162839]" />
            </div>
            <span className="text-[12px] text-green-600 font-bold bg-green-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">ACTIVE DISPLAY</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1">TOTAL DISPLAY STOCK</p>
            <h3 className="text-[32px] font-bold text-[#162839] tracking-tight">{totalDisplay.toLocaleString()} <span className="text-[16px] font-normal text-neutral-500">Items</span></h3>
          </div>
        </div>

        <div className="bg-white border border-[#edeeef] p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#cce5ff] rounded-lg">
              <PackageOpen className="w-5 h-5 text-[#006397]" />
            </div>
            <span className="text-[12px] text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">BACKROOM STOCK</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1">TOTAL WAREHOUSE STOCK</p>
            <h3 className="text-[32px] font-bold text-[#162839] tracking-tight">{totalWarehouse.toLocaleString()} <span className="text-[16px] font-normal text-neutral-500">Items</span></h3>
          </div>
        </div>
      </div>

      {/* Stock Alerts & Table Section */}
      <div className="space-y-6">
        {data.stockAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500 w-5 h-5" />
              <p className="text-[14px] font-medium text-red-800">
                <span className="font-bold">{data.stockAlerts.length} items</span> are below minimum threshold in the shop.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#edeeef] flex justify-between items-center bg-[#f3f4f5]/30">
            <h4 className="text-[20px] font-bold text-[#162839]">Display & Warehouse Stock</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f3f4f5] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4 text-right">Display Stock</th>
                  <th className="px-6 py-4 text-right">Warehouse Stock</th>
                  <th className="px-6 py-4 text-right">Total Status</th>
                </tr>
              </thead>
              <tbody className="text-[14px] divide-y divide-[#edeeef]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">Loading shop inventory...</td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">No shop items found.</td>
                  </tr>
                ) : inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#162839]">{item.name}</p>
                      <p className="text-[12px] text-neutral-500">{item.category}</p>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 font-mono text-[13px]">{item.sku}</td>
                    <td className="px-6 py-4 text-right font-medium">{item.display_stock?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-right font-medium">{item.warehouse_stock?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        (item.stock || 0) < (item.minStock || 0) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {(item.stock || 0) < (item.minStock || 0) ? 'Low Stock' : 'Healthy'}
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
