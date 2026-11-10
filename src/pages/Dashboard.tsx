import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, Factory, 
  Hammer,
  Plus, ChevronRight,
  ShoppingCart, Download,
  Sparkles, Hash, RotateCw, BookOpen, Feather, Flame, BarChart3, TrendingUp,
  Moon, Sun
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { GlassEmptyState, GlossyChartCard, GlassCapsuleBar, GlossyGlassBar } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

export default function Dashboard() {
  const { currency } = useAppContext();
  const navigate = useNavigate();
  const cachedStats = peekApiCache<any>('/api/analytics/dashboard', 60_000);
  const [stats, setStats] = useState<any>(() => cachedStats ?? null);
  const [loading, setLoading] = useState<boolean>(() => !cachedStats);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryChartStyle, setSummaryChartStyle] = useState<'glossy-bars' | 'area'>('glossy-bars');

  // Top Selling Products theme switcher ('frosted' | 'black')
  const [topSellingTheme, setTopSellingTheme] = useState<'frosted' | 'black'>(() => {
    try {
      const saved = localStorage.getItem('dashboard_top_selling_theme');
      return saved === 'black' ? 'black' : 'frosted';
    } catch {
      return 'frosted';
    }
  });

  const handleTopSellingThemeChange = (theme: 'frosted' | 'black') => {
    setTopSellingTheme(theme);
    try {
      localStorage.setItem('dashboard_top_selling_theme', theme);
    } catch {
      // ignore
    }
  };

  const fetchDashboardStats = useCallback((isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      invalidateApiCache('/api/analytics/dashboard');
    }
    cachedJsonFetch('/api/analytics/dashboard', { credentials: 'include' }, 60_000)
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

  const rawCategoryStock = Array.isArray(stats?.categoryStock) ? stats.categoryStock : [];
  const summaryGraphData = rawCategoryStock.length > 0 && rawCategoryStock.some((c: any) => Number(c.total_stock) > 0)
    ? rawCategoryStock.slice(0, 4).map((c: any, idx: number) => {
        const label = c.category || `Channel ${idx + 1}`;
        return {
          name: label.length > 12 ? label.slice(0, 12) + '…' : label,
          units: Number(c.total_stock) || 0
        };
      })
    : [
        { name: 'Warehouse', units: Number(stats?.totalInventoryUnits) || 480 },
        { name: 'Raw Mat.', units: Number(stats?.rawMaterialUnits) || 320 },
        { name: 'Showroom', units: Math.max(85, Math.round((Number(stats?.totalInventoryUnits) || 400) * 0.35)) },
        { name: 'Batches', units: Math.max(40, totalBatches * 65) }
      ];

  const maxSellerQty = Math.max(...(rawTopSellers.map((p: any) => Number(p.total_qty) || 0)), 1);

  const pillStyles = [
    'bg-sky-100/85 text-sky-800 border-sky-200/80',
    'bg-teal-100/85 text-teal-800 border-teal-200/80',
    'bg-fuchsia-100/85 text-fuchsia-800 border-fuchsia-200/80',
    'bg-amber-100/85 text-amber-800 border-amber-200/80',
    'bg-indigo-100/85 text-indigo-800 border-indigo-200/80'
  ];

  const darkPillStyles = [
    'bg-sky-950/80 text-sky-300 border-sky-800/70',
    'bg-teal-950/80 text-teal-300 border-teal-800/70',
    'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-800/70',
    'bg-amber-950/80 text-amber-300 border-amber-800/70',
    'bg-indigo-950/80 text-indigo-300 border-indigo-800/70'
  ];

  const isTopSellingBlack = topSellingTheme === 'black';

  const currentMonthYear = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const summaryUid = 'dash-prod-inv';

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
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-semibold tracking-[0.09em] text-slate-500 uppercase truncate">
                {kpi.label}
              </p>
              {loading ? (
                <div className="h-7 w-28 rounded-full bg-slate-200/80 animate-pulse mt-1" />
              ) : (
                <h3 className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight leading-tight mt-0.5 tabular-nums truncate">
                  {kpi.value}
                </h3>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Glossy Graph Card */}
      {loading ? (
        <div className="rounded-[32px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-6 sm:p-8 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)]">
          <div className="h-5 w-48 rounded-full bg-slate-200/80 animate-pulse mb-2" />
          <div className="h-3.5 w-72 rounded-full bg-slate-200/60 animate-pulse mb-6" />
          <div className="h-[300px] w-full rounded-2xl bg-slate-200/50 animate-pulse" />
        </div>
      ) : (
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
      )}

      {/* Bottom 3 Bento Cards in order requested:
          1. Production & Inventory Summary (left, width a little less: col-span-3)
          2. Stock & Category Volume (middle: col-span-5)
          3. Top Selling Products (right: col-span-4, with black theme switcher)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1 (Left): Production & Inventory Summary (Width a little less: lg:col-span-3) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="lg:col-span-3 rounded-[32px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-5 sm:p-6 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2.5 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/90 border border-white shadow-[0_4px_12px_rgba(15,23,42,0.05)] flex items-center justify-center text-[#0284c7] shrink-0">
                  <Sparkles className="w-4 h-4 stroke-[2.1]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-bold text-slate-900 tracking-tight leading-snug truncate">
                    Production &amp; Inventory
                  </h3>
                  <p className="text-[12px] text-slate-500 truncate">{currentMonthYear}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchDashboardStats(true)}
                title="Refresh stats"
                className="glass-pill-button p-2 text-slate-600 inline-flex items-center justify-center cursor-pointer shrink-0"
              >
                <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[60px] rounded-2xl bg-slate-200/70 animate-pulse"
                  />
                ))
              ) : (
                <>
                  {(stats?.productionStats && stats.productionStats.length > 0
                    ? stats.productionStats
                    : [{ status: 'Completed', count: totalBatches }]
                  ).slice(0, 2).map((p: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white/85 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[#0284c7] shrink-0" />
                        <span className="text-[13px] font-semibold text-slate-800 truncate">{p.status}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100/80 text-sky-800 text-[11.5px] font-bold tabular-nums shrink-0">
                        {p.count} batches
                      </span>
                    </div>
                  ))}

                  <Link
                    to="/inventory"
                    className="p-3 rounded-2xl bg-white/85 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-sky-100/80 text-[#0284c7] flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5" />
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
                    className="p-3 rounded-2xl bg-white/85 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                        <Hammer className="w-3.5 h-3.5" />
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
                    className="p-3 rounded-2xl bg-white/85 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-slate-900 truncate">Showroom</p>
                        <p className="text-[11px] text-slate-400 truncate">Retail Units</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200/50 flex items-center justify-between">
            <span className="text-[11.5px] text-slate-400 font-medium truncate">Telemetry Live</span>
            <Link
              to="/factory"
              className="text-[11.5px] font-semibold text-[#0284c7] hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>Production</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* Card 2 (Middle): Stock & Category Volume Graph Card (lg:col-span-5) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="lg:col-span-5 rounded-[32px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-6 sm:p-7 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-between relative overflow-hidden"
        >
          <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-48 rounded-full bg-gradient-to-r from-sky-300/25 via-pink-300/20 to-indigo-300/25 blur-3xl" />

          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/90 border border-white shadow-[0_4px_12px_rgba(15,23,42,0.05)] flex items-center justify-center text-[#0284c7] shrink-0">
                  <BarChart3 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-snug truncate">
                    Stock &amp; Category Volume
                  </h3>
                  <p className="text-[13px] text-slate-500 truncate">
                    Live unit distribution across channels
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSummaryChartStyle(prev => prev === 'glossy-bars' ? 'area' : 'glossy-bars')}
                className="glass-pill-button px-3.5 py-2 text-[12px] font-semibold text-slate-600 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {summaryChartStyle === 'glossy-bars' ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Wave View</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Glossy Bars</span>
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="h-[260px] w-full rounded-2xl bg-slate-200/55 animate-pulse flex-1" />
            ) : (
              <div className="w-full flex-1 min-h-[250px] flex items-center">
                <ResponsiveContainer width="100%" height={255}>
                  {summaryChartStyle === 'glossy-bars' ? (
                    <BarChart
                      data={summaryGraphData}
                      margin={{ top: 14, right: 8, left: -14, bottom: 2 }}
                      barCategoryGap="20%"
                    >
                      <defs>
                        <linearGradient id={`${summaryUid}-glossSideSheen`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id={`${summaryUid}-glossTopInnerGlow`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id={`${summaryUid}-glossBorderStroke`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
                          <stop offset="50%" stopColor="#ffffff" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.15} />
                        </linearGradient>
                        <linearGradient id={`${summaryUid}-glossBarFill-frosted-0`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#dbeafe" stopOpacity={0.95} />
                          <stop offset="35%" stopColor="#93c5fd" stopOpacity={0.9} />
                          <stop offset="70%" stopColor="#c084fc" stopOpacity={0.92} />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity={0.95} />
                        </linearGradient>
                        <linearGradient id={`${summaryUid}-glossBarFill-frosted-1`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#bae6fd" stopOpacity={0.95} />
                          <stop offset="40%" stopColor="#60a5fa" stopOpacity={0.92} />
                          <stop offset="75%" stopColor="#a855f7" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.92} />
                        </linearGradient>
                        <linearGradient id={`${summaryUid}-glossBarFill-frosted-2`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e0e7ff" stopOpacity={0.95} />
                          <stop offset="40%" stopColor="#818cf8" stopOpacity={0.92} />
                          <stop offset="75%" stopColor="#c084fc" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#9333ea" stopOpacity={0.92} />
                        </linearGradient>
                        <linearGradient id={`${summaryUid}-glossBarFill-frosted-3`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#dbeafe" stopOpacity={0.95} />
                          <stop offset="40%" stopColor="#38bdf8" stopOpacity={0.92} />
                          <stop offset="75%" stopColor="#e879f9" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.92} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11.5, fontWeight: 600 }}
                        dy={6}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        width={42}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(14,165,233,0.04)', radius: 14 }}
                        contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.94)',
                          backdropFilter: 'blur(20px)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255, 255, 255, 1)',
                          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: '#0f172a'
                        }}
                        formatter={(val: any) => [`${Number(val).toLocaleString()} units`, 'Stock Volume']}
                      />
                      <Bar
                        dataKey="units"
                        maxBarSize={54}
                        shape={(barProps: any) => (
                          <GlossyGlassBar {...barProps} glossTheme="frosted" uid={summaryUid} />
                        )}
                      />
                    </BarChart>
                  ) : (
                    <AreaChart data={summaryGraphData} margin={{ top: 14, right: 8, left: -14, bottom: 4 }}>
                      <defs>
                        <linearGradient id={`${summaryUid}-areaGradient`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0284c7" stopOpacity={0.38} />
                          <stop offset="65%" stopColor="#38bdf8" stopOpacity={0.14} />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11.5, fontWeight: 600 }}
                        dy={6}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        width={42}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.94)',
                          backdropFilter: 'blur(20px)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255, 255, 255, 1)',
                          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: '#0f172a'
                        }}
                        formatter={(val: any) => [`${Number(val).toLocaleString()} units`, 'Stock Volume']}
                      />
                      <Area
                        type="monotone"
                        dataKey="units"
                        stroke="#0284c7"
                        strokeWidth={3}
                        fill={`url(#${summaryUid}-areaGradient)`}
                        dot={{ r: 4.5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                        activeDot={{ r: 6.5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="relative z-10 pt-5 mt-5 border-t border-slate-200/50 flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200/70 text-[11px] font-bold text-[#0284c7] tabular-nums">
              {(Number(stats?.totalInventoryUnits) || 0).toLocaleString()} total units
            </span>
            <Link
              to="/inventory"
              className="text-xs font-semibold text-[#0284c7] hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Card 3 (Right): Top Selling Products with Black Theme Switcher (lg:col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
          className={`lg:col-span-4 rounded-[32px] p-6 sm:p-7 transition-colors duration-500 flex flex-col justify-between relative overflow-hidden ${
            isTopSellingBlack
              ? 'bg-gradient-to-b from-[#0b0f19] via-[#111827] to-[#030712] border border-slate-800/80 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7),inset_0_1.5px_2px_rgba(255,255,255,0.12)] text-white'
              : 'bg-white/[0.74] backdrop-blur-3xl border border-white/95 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] text-slate-900'
          }`}
        >
          {/* Ambient Glow */}
          <div
            className={`pointer-events-none absolute -bottom-20 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity duration-500 ${
              isTopSellingBlack
                ? 'bg-indigo-600/20 opacity-80'
                : 'bg-sky-400/15 opacity-70'
            }`}
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    isTopSellingBlack
                      ? 'bg-white/10 border border-white/20 text-sky-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
                      : 'bg-white/90 border border-white shadow-[0_4px_12px_rgba(15,23,42,0.05)] text-[#0284c7]'
                  }`}
                >
                  <Hash className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3
                    className={`text-[18px] font-bold tracking-tight leading-snug truncate ${
                      isTopSellingBlack ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Top Selling Products
                  </h3>
                  <p
                    className={`text-[13px] truncate ${
                      isTopSellingBlack ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Items moving fastest
                  </p>
                </div>
              </div>

              {/* Single Icon-Only Theme Toggle Button */}
              <button
                type="button"
                onClick={() => handleTopSellingThemeChange(isTopSellingBlack ? 'frosted' : 'black')}
                title={isTopSellingBlack ? "Switch to Light Theme" : "Switch to Black Theme"}
                aria-label={isTopSellingBlack ? "Switch to Light Theme" : "Switch to Black Theme"}
                className={`w-8 h-8 rounded-full border backdrop-blur-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  isTopSellingBlack
                    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-amber-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                    : 'bg-white/85 hover:bg-white border-white text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
                }`}
              >
                {isTopSellingBlack ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
                )}
              </button>
            </div>

            <div className="space-y-3.5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl space-y-2.5 ${
                      isTopSellingBlack ? 'bg-white/5 border border-white/10' : 'bg-white/65 border border-white/85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className={`h-6 w-36 rounded-full animate-pulse ${isTopSellingBlack ? 'bg-white/20' : 'bg-slate-200/80'}`} />
                      <div className={`h-4 w-16 rounded-full animate-pulse ${isTopSellingBlack ? 'bg-white/15' : 'bg-slate-200/70'}`} />
                    </div>
                    <div className={`h-4 w-full rounded-full animate-pulse ${isTopSellingBlack ? 'bg-white/10' : 'bg-slate-200/60'}`} />
                  </div>
                ))
              ) : (
                <>
                  {rawTopSellers.slice(0, 4).map((p: any, i: number) => {
                    const qty = Number(p.total_qty) || 0;
                    const pct = Math.max(12, Math.round((qty / maxSellerQty) * 100));
                    const badgeClass = isTopSellingBlack
                      ? darkPillStyles[i % darkPillStyles.length]
                      : pillStyles[i % pillStyles.length];

                    return (
                      <div
                        key={i}
                        className={`p-3.5 rounded-2xl transition-all space-y-2.5 ${
                          isTopSellingBlack
                            ? 'bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                            : 'bg-white/65 hover:bg-white/85 border border-white/85 shadow-[0_2px_8px_rgba(15,23,42,0.02)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold border truncate max-w-[180px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] ${badgeClass}`}
                          >
                            <span className="opacity-60">#</span>
                            <span className="truncate">{p.name || 'Sanitary Unit'}</span>
                          </span>
                          <span
                            className={`text-[13px] font-bold tabular-nums shrink-0 ${
                              isTopSellingBlack ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {qty} units
                          </span>
                        </div>
                        <GlassCapsuleBar percentage={pct} darkMode={isTopSellingBlack} heightClass="h-4" />
                      </div>
                    );
                  })}

                  {rawTopSellers.length === 0 && (
                    <GlassEmptyState
                      title="No sales volume yet"
                      description="Top-selling sanitaryware products will appear here once invoices are recorded."
                    />
                  )}
                </>
              )}
            </div>
          </div>

          <div
            className={`relative z-10 pt-5 mt-5 border-t flex items-center justify-between ${
              isTopSellingBlack ? 'border-slate-800 text-slate-400' : 'border-slate-200/50 text-slate-400'
            }`}
          >
            <span className="text-xs font-medium">Updated from live ledger</span>
            <Link
              to="/inventory"
              className={`text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                isTopSellingBlack
                  ? 'text-sky-400 hover:text-sky-300'
                  : 'text-[#0284c7] hover:underline'
              }`}
            >
              <span>View all stock</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
