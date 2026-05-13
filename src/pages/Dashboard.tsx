import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, Users, Package, Factory, 
  Wallet, AlertTriangle, Clock, Hammer,
  Plus, Filter, AlertCircle, ChevronRight,
  ArrowUpRight, ArrowDownRight, ShoppingCart, Download
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleExport = () => {
    if (!stats) return;

    const kpiData = [
      ['KPI', 'Value', 'Status'],
      ['Inventory Value', stats.stockValue || 0, 'Total Asset Value'],
      ['Low Stock Items', stats.lowStock || 0, 'Requires Attention'],
      ['Top Seller', stats.topSellers?.[0]?.name || 'N/A', 'By Volume'],
      ['Production Batches', stats.productionStats?.length || 0, 'Total Batches']
    ];

    const topSellersData = [
      [''],
      ['Top Selling Products'],
      ['Product', 'Qty Sold'],
      ...(stats.topSellers || []).map((p: any) => [p.name, p.total_qty])
    ];

    const productionData = [
      [''],
      ['Production Overview'],
      ['Status', 'Batch Count'],
      ...(stats.productionStats || []).map((p: any) => [p.status, p.count])
    ];

    const csvContent = [
      ...kpiData,
      ...topSellersData,
      ...productionData
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Dashboard_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetch('/api/analytics/dashboard', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Stats fetch err:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#162839]"></div>
      </div>
    );
  }

  const kpis = [
    { label: 'Inventory Value', value: `$${(stats?.stockValue || 0).toLocaleString()}`, trend: null, sub: 'Total Asset Value', icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Low Stock Items', value: stats?.lowStock || 0, trend: null, sub: 'Requires Attention', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Top Seller', value: stats?.topSellers?.[0]?.name || 'N/A', trend: null, sub: 'By volume', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Production Batches', value: stats?.productionStats?.length || 0, trend: null, sub: 'Total Batches', icon: Factory, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <span className="text-[#006397] font-bold">Dashboard Overview</span>
          </nav>
          <h2 className="text-[28px] sm:text-[32px] font-black text-[#001d31] tracking-tight leading-none">Dashboard Overview</h2>
          <p className="text-[14px] sm:text-[16px] text-neutral-500 mt-1">Real-time enterprise metrics & inventory status.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-neutral-200 text-neutral-900 font-bold rounded-lg hover:bg-neutral-50 transition-all text-[14px] shadow-sm"
          >
            <Download className="w-4 h-4 text-neutral-400" />
            Export Stats
          </button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 border border-[#edeeef] rounded-2xl shadow-sm hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">{kpi.label}</p>
              <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-[24px] font-bold text-[#162839] tracking-tight leading-none">{kpi.value}</h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 font-medium whitespace-nowrap">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Sellers Chart */}
        <div className="lg:col-span-2 bg-white border border-[#edeeef] rounded-2xl p-6 shadow-sm">
           <div className="flex justify-between items-center mb-6">
             <h4 className="text-[20px] font-bold text-[#162839]">Top Selling Products</h4>
             <Link to="/inventory" className="text-[12px] font-bold text-[#006397] hover:underline flex items-center gap-1">
               Full Inventory <ChevronRight className="w-3 h-3" />
             </Link>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats?.topSellers || []} layout="vertical" margin={{ left: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#162839', fontSize: 12, fontWeight: 700 }} />
                    <Tooltip cursor={{ fill: '#f8f9fa' }} />
                    <Bar dataKey="total_qty" fill="#5cb8fd" radius={[0, 4, 4, 0]} barSize={24} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Product Catalog Overview Quick Links */}
        <div className="bg-white border border-[#edeeef] rounded-2xl p-6 shadow-sm">
           <h4 className="text-[20px] font-bold text-[#162839] mb-4">Product Overview</h4>
           <div className="grid grid-cols-1 gap-3">
              <Link to="/inventory" className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-xl hover:bg-[#e3f2fd] transition-colors group">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="font-bold text-[#162839] text-[14px]">Finished Goods</p>
                       <p className="text-[11px] text-neutral-400 uppercase tracking-tight">Main Catalog</p>
                    </div>
                 </div>
                 <ChevronRight className="w-4 h-4 text-neutral-300" />
              </Link>
              
              <Link to="/purchases/raw-materials" className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-xl hover:bg-[#e3f2fd] transition-colors group">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <Hammer className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="font-bold text-[#162839] text-[14px]">Raw Materials</p>
                       <p className="text-[11px] text-neutral-400 uppercase tracking-tight">Supply chain</p>
                    </div>
                 </div>
                 <ChevronRight className="w-4 h-4 text-neutral-300" />
              </Link>

              <Link to="/inventory/shop" className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-xl hover:bg-[#e3f2fd] transition-colors group">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-all">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="font-bold text-[#162839] text-[14px]">Showroom Stock</p>
                       <p className="text-[11px] text-neutral-400 uppercase tracking-tight">Direct Sales</p>
                    </div>
                 </div>
                 <ChevronRight className="w-4 h-4 text-neutral-300" />
              </Link>
           </div>
        </div>
      </div>

      {/* Top Sellers List and Production */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#edeeef] rounded-2xl p-6 shadow-sm">
           <h4 className="text-[20px] font-bold text-[#162839] mb-6">Top Selling Breakdown</h4>
           <div className="space-y-3">
              {(stats?.topSellers || []).slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-xl hover:shadow-md transition-shadow">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center font-bold text-neutral-400">
                         {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-[#162839]">{p.name || 'Unknown Product'}</p>
                        <p className="text-[12px] text-neutral-400">{p.sku}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-black text-[#162839]">{p.total_qty} sold</p>
                      <p className="text-[11px] text-emerald-500 font-bold uppercase tracking-tight">Active Seller</p>
                   </div>
                </div>
              ))}
              {(!stats?.topSellers || stats.topSellers.length === 0) && (
                <p className="text-center text-neutral-400 py-10 italic">No sales performance data yet.</p>
              )}
           </div>
        </div>

        <div className="bg-white border border-[#edeeef] rounded-2xl p-6 shadow-sm">
           <h4 className="text-[20px] font-bold text-[#162839] mb-6">Production Overview</h4>
           <div className="space-y-4">
              {stats?.productionStats?.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-xl border border-transparent hover:border-[#5cb8fd] transition-all">
                   <span className="font-bold text-[#162839]">{p.status}</span>
                   <div className="flex items-center gap-3">
                      <span className="text-[13px] text-neutral-400 font-medium">Batches</span>
                      <span className="bg-[#162839] text-white px-4 py-1.5 rounded-full text-xs font-black min-w-[40px] text-center">{p.count}</span>
                   </div>
                </div>
              ))}
              {(!stats?.productionStats || stats.productionStats.length === 0) && (
                <p className="text-center text-neutral-400 py-10">No production activity detected.</p>
              )}
           </div>
        </div>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#5cb8fd] text-[#00476e] rounded-full shadow-2xl flex items-center justify-center z-50 transition-transform cursor-pointer"
        onClick={() => navigate('/sales/add')}
      >
        <Plus className="w-8 h-8" />
      </motion.button>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-0.5 duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-medium text-neutral-500 tracking-tight">{title}</h3>
        <span className="p-2 bg-neutral-50 rounded-lg">
          <Icon className="w-[18px] h-[18px] text-neutral-600" />
        </span>
      </div>
      <div className="text-3xl font-semibold text-neutral-900 mb-2 tracking-tight">{value}</div>
      <div className={`flex items-center text-[12px] font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
        {trendUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
        {trend}
      </div>
    </div>
  );
}
