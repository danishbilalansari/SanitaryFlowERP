import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, Package, Factory, 
  Hammer,
  Plus, ChevronRight,
  ShoppingCart, Download,
  Sparkles, Hash, RotateCw, BookOpen, Feather, Flame
} from 'lucide-react';
import { motion } from 'motion/react';
import { DashboardSkeleton, GlassEmptyState, GlossyChartCard, GlassCapsuleBar } from '../components/GlassUI';
import { cachedJsonFetch, invalidateApiCache } from '../lib/apiCache';

export default function Dashboard() {
  const { currency } = useAppContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = useCallback((isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      invalidateApiCache('/api/analytics/dashboard');
    }
    cachedJsonFetch('/api/analytics/dashboard', undefined, 30_000)
      .then(data => {
        setStats(data || {});
        setLoading(false);
        setRefreshing(false);
      })
      .catch(err => {
        console.error('Stats fetch err:', err);
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

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

  if (loading) {
    return <DashboardSkeleton />;
  }

  const totalBatches = stats?.productionStats?.reduce((acc: number, s: any) => acc + Number(s.count), 0) || 0;

  const kpis = [
    {
      label: 'INVENTORY VALUE',
      value: formatCurrency(stats?.stockValue || 0, currency),
      icon: BookOpen,
      iconColor: 'text-[#0284c7]'
    },
    {
      label: 'LOW STOCK ALERTS',
      value: `${stats?.lowStock || 0}`,
      icon: Feather,
      iconColor: 'text-indigo-600'
    },
    {
      label: 'FACTORY EFFICIENCY',
      value: `${stats?.productionEfficiency || 0}%`,
      icon: Flame,
      iconColor: 'text-amber-500'
    },
    {
      label: 'PRODUCTION BATCHES',
      value: `${totalBatches} batches`,
      icon: Factory,
      iconColor: 'text-emerald-600'
    }
  ];

  // Prepare data for the Glossy Graph (image_26474c66.png reference)
  const rawTopSellers = stats?.topSellers || [];
  const chartData = rawTopSellers.length > 0
    ? [...rawTopSellers].reverse().map((item: any, idx: number) => ({
        name: item.name ? (item.name.length > 16 ? item.name.slice(0, 16) + '…' : item.name) : `Item ${idx + 1}`,
        fullName: item.name || `Item ${idx + 1}`,
        total_qty: Number(item.total_qty) || 0
      }))
    : [
        { name: 'Batch 1', fullName: 'Ceramic Basin', total_qty: 14 },
        { name: 'Batch 2', fullName: 'One-Piece WC', total_qty: 42 },
        { name: 'Batch 3', fullName: 'Pedestal Sink', total_qty: 24 },
        { name: 'Batch 4', fullName: 'Wall Hung WC', total_qty: 15 }
      ];

  const maxSellerQty = Math.max(...(rawTopSellers.map((p: any) => Number(p.total_qty) || 0)), 1);

  const pillStyles = [
    'bg-sky-100/85 text-sky-800 border-sky-200/80',
    'bg-teal-100/85 text-teal-800 border-teal-200/80',
    'bg-fuchsia-100/85 text-fuchsia-800 border-fuchsia-200/80',
    'bg-amber-100/85 text-amber-800 border-amber-200/80',
    'bg-indigo-100/85 text-indigo-800 border-indigo-200/80'
  ];

  const currentMonthYear = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Top Insights Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1"
      >
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-[#0284c7] uppercase mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>SANITARYFLOW INSIGHTS</span>
          </div>
          <h1 className="text-[32px] sm:text-[36px] font-bold text-slate-900 tracking-[-0.025em] leading-tight">
            Operations Insights
          </h1>
          <p className="text-[14.5px] text-slate-500 mt-1 font-normal">
            Your production rhythm, inventory milestones, top-selling products, and monthly factory summary.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="glass-pill-button px-4 py-2.5 text-[12.5px] font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>Export CSV</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/sales/add')}
            className="glass-pill-button px-4 py-2.5 text-[12.5px] font-semibold text-slate-900 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#0284c7] stroke-[2.5]" />
            <span>New Order</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Horizontal KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-5 shadow-[0_10px_30px_-6px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/90 border border-white shadow-[0_4px_12px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center shrink-0">
              <kpi.icon className={`w-5 h-5 ${kpi.iconColor} stroke-[1.9]`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold tracking-[0.09em] text-slate-500 uppercase truncate">
                {kpi.label}
              </p>
              <h3 className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight leading-tight mt-0.5 tabular-nums truncate">
                {kpi.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Glossy Graph Card */}
      <GlossyChartCard
        uid="dashboard"
        title="Sales Volume Trend"
        subtitle="Balance of unit demand flow across your top-performing sanitaryware products"
        data={chartData}
        xKey="name"
        yKey="total_qty"
        valueLabel="Volume Sold"
        valueFormatter={(value: any) => `${value} units`}
        chartHeight={300}
      />

      {/* Bottom 2-Column Bento Cards (Modeled after Common Themes & Monthly Summary in image_593a5833.png) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Card: Top Velocity Products (Styled after Common Themes) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="md:col-span-5 rounded-[32px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-6 sm:p-7 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/90 border border-white shadow-[0_4px_12px_rgba(15,23,42,0.05)] flex items-center justify-center text-[#0284c7] shrink-0">
                <Hash className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-snug">
                  Top Selling Products
                </h3>
                <p className="text-[13px] text-slate-500">
                  Items moving fastest across channels
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {rawTopSellers.slice(0, 4).map((p: any, i: number) => {
                const qty = Number(p.total_qty) || 0;
                const pct = Math.max(12, Math.round((qty / maxSellerQty) * 100));
                const badgeClass = pillStyles[i % pillStyles.length];
                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-white/65 border border-white/85 shadow-[0_2px_8px_rgba(15,23,42,0.02)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold border truncate max-w-[210px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] ${badgeClass}`}
                      >
                        <span className="opacity-60">#</span>
                        <span className="truncate">{p.name || 'Sanitary Unit'}</span>
                      </span>
                      <span className="text-[13px] font-bold text-slate-900 tabular-nums shrink-0">
                        {qty} units
                      </span>
                    </div>
                    <GlassCapsuleBar percentage={pct} darkMode={false} heightClass="h-4" />
                  </div>
                );
              })}

              {rawTopSellers.length === 0 && (
                <GlassEmptyState
                  title="No sales volume yet"
                  description="Top-selling sanitaryware products will appear here once invoices are recorded."
                />
              )}
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-200/50 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Updated from live ledger</span>
            <Link
              to="/inventory"
              className="text-xs font-semibold text-[#0284c7] hover:underline inline-flex items-center gap-1"
            >
              <span>View all stock</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Right Card: Production & Channel Summary (Styled after AI Monthly Summary) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="md:col-span-7 rounded-[32px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-6 sm:p-7 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white/90 border border-white shadow-[0_4px_12px_rgba(15,23,42,0.05)] flex items-center justify-center text-[#0284c7] shrink-0">
                  <Sparkles className="w-4 h-4 stroke-[2.1]" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-snug">
                    Production &amp; Inventory Summary
                  </h3>
                  <p className="text-[13px] text-slate-500">{currentMonthYear}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchDashboardStats(true)}
                className="glass-pill-button px-4 py-2 text-[12.5px] font-semibold text-slate-600 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Active Production Status Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {(stats?.productionStats || []).map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/85 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                    <span className="text-[13.5px] font-semibold text-slate-800">{p.status}</span>
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-sky-100/80 text-sky-800 text-[12px] font-bold tabular-nums">
                    {p.count} batches
                  </span>
                </div>
              ))}
            </div>

            {/* Direct Inventory Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/inventory"
                className="p-3.5 rounded-2xl bg-white/85 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-100/80 text-[#0284c7] flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-slate-900 truncate">Finished Goods</p>
                    <p className="text-[11px] text-slate-400 truncate">Main Warehouse</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/purchases/raw-materials"
                className="p-3.5 rounded-2xl bg-white/85 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                    <Hammer className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-slate-900 truncate">Raw Materials</p>
                    <p className="text-[11px] text-slate-400 truncate">Clay &amp; Glaze</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/inventory/shop"
                className="p-3.5 rounded-2xl bg-white/85 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-slate-900 truncate">Showroom</p>
                    <p className="text-[11px] text-slate-400 truncate">Retail Units</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
