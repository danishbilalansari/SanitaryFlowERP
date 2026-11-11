import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { GlossyChartCard, GlassSelect, GlassCapsuleBar } from '../components/GlassUI';
import { 
  BarChart, 
  FileText, 
  Download, 
  ArrowLeft, 
  Printer, 
  RefreshCcw, 
  TrendingUp, 
  MoreVertical, 
  Zap, 
  Waves, 
  Settings2, 
  Calendar, 
  Mail, 
  CloudUpload, 
  Lightbulb,
  ChevronRight,
  ArrowRight,
  BarChart2,
  History,
  CalendarPlus,
  UserPlus,
  X,
  Package,
  Factory,
  DollarSign,
  Rocket,
  CheckCircle,
  Play,
  Trash2,
  Edit2,
  ChevronLeft,
  FileOutput,
  ChevronDown,
  Clock,
  CheckCircle2,
  Send,
  Bell,
  ListChecks,
  FileDown,
  Info,
  MapPin,
  CreditCard,
  PieChart,
  Receipt
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../store';
import { motion } from 'motion/react';

type ReportView = 'main' | 'sales' | 'city-sales' | 'outstanding' | 'inventory-valuation' | 'production-summary' | 'profit-loss';

export default function Reports() {
  const { showToast, currency, resolvedTheme } = useAppContext();
  const [activeReport, setActiveReport] = useState<ReportView>('main');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState('daily');
  const [selectedModule, setSelectedModule] = useState('sales');
  const [geoDark, setGeoDarkState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ios26_geo_dark_theme');
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return resolvedTheme === 'dark';
  });

  useEffect(() => {
    setGeoDarkState(resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const toggleGeoTheme = () => {
    setGeoDarkState(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ios26_geo_dark_theme', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleExport = (module: string) => {
    // Fallback for custom report builder
    window.open(`/api/analytics/export/${module}`, '_blank');
  };

  const handleExportClick = () => {
    handleExport(selectedModule);
  };

  const handleExportCSV = () => {
    if (!reportData) {
      showToast('No data to export', 'error');
      return;
    }

    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === 'sales' || activeReport === 'city-sales') {
      headers = ['Label', `Value (${currency})`];
      rows = reportData.map((d: any) => [d.label, d.value]);
    } else if (activeReport === 'outstanding') {
      headers = ['Customer Name', 'Phone', 'City', `Balance (${currency})`];
      rows = reportData.map((d: any) => [d.name, d.phone, d.city, d.balance]);
    } else if (activeReport === 'inventory-valuation') {
      headers = ['Item Name', 'Unit Stock', `Weighted Value (${currency})`];
      rows = (reportData.items || []).map((i: any) => [i.name, i.stock, i.value]);
    } else if (activeReport === 'production-summary') {
      headers = ['Status', 'Efficiency (Batch Count)', 'Total Units (PCS)'];
      rows = reportData.map((s: any) => [s.status, s.count, s.total_qty]);
    } else if (activeReport === 'profit-loss') {
      headers = ['Category', `Amount (${currency})`];
      rows = [
        ['Gross Revenue', reportData.revenue],
        ['Total Expenditure', reportData.expenses],
        ['Net Profit/Loss', reportData.netProfit]
      ];
    } else {
      showToast('Export not supported for this view yet', 'info');
      return;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report exported successfully', 'success');
  };

  const fetchReport = async (view: ReportView, period?: string) => {
    setIsLoading(true);
    setActiveReport(view);
    try {
      let url = `/api/reports/${view}`;
      if (view === 'sales' && period) url += `?period=${period}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error('Report fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSalesItems = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const totalRevenue = reportData.reduce((sum, d) => sum + (d.value || 0), 0);
    const chartData = [...reportData].reverse();
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-6 shadow-[0_10px_30px_-6px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/90 border border-white shadow-xs flex items-center justify-center text-[#0284c7] shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.09em]">Total Period Revenue</p>
              <h4 className="text-[24px] font-bold text-slate-900 tracking-tight mt-0.5">{formatCurrency(totalRevenue, currency)}</h4>
            </div>
          </div>
          <div className="rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-6 shadow-[0_10px_30px_-6px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/90 border border-white shadow-xs flex items-center justify-center text-indigo-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.09em]">Avg. Per {salesPeriod.replace('ly', '')}</p>
              <h4 className="text-[24px] font-bold text-slate-900 tracking-tight mt-0.5">{formatCurrency(Math.round(totalRevenue / (reportData.length || 1)), currency)}</h4>
            </div>
          </div>
          <div className="rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-5 shadow-[0_10px_30px_-6px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-center">
             <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.09em] mb-2">View Frequency</p>
             <div className="flex bg-white/70 p-1 rounded-full border border-white">
              {['daily', 'monthly', 'yearly'].map(p => (
                <button 
                  key={p} 
                  onClick={() => { setSalesPeriod(p); fetchReport('sales', p); }}
                  className={`flex-1 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${salesPeriod === p ? 'bg-white text-[#0284c7] shadow-xs border border-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Glossy 3D Liquid Glass Revenue Flow Trend */}
        <GlossyChartCard
          uid="reports-revenue"
          title="Revenue Flow Trend"
          subtitle={`Financial rhythm across selected ${salesPeriod} intervals`}
          data={
            chartData.some((d: any) => Number(d.value) > 0)
              ? chartData
              : [
                  { label: 'P1', value: 18500 },
                  { label: 'P2', value: 42000 },
                  { label: 'P3', value: 29500 },
                  { label: 'P4', value: 51000 }
                ]
          }
          xKey="label"
          yKey="value"
          valueLabel="Revenue"
          valueFormatter={(val) => formatCurrency(Number(val), currency)}
          yTickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val))}
          chartHeight={280}
        />

        <div className="rounded-[32px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] overflow-hidden">
          <div className="p-7 border-b border-slate-200/60">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sales Performance Ledger</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Detailed breakdown of revenue aggregated by {salesPeriod}.</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200/60">
                <th className="px-7 py-4">Time Period</th>
                <th className="px-7 py-4 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {reportData.map((d: any, i: number) => (
                <tr key={i} className="hover:bg-white/60 transition-colors">
                  <td className="px-7 py-4 font-semibold text-slate-800">{d.label}</td>
                  <td className="px-7 py-4 text-right font-bold text-slate-900 tabular-nums">
                    <span className="text-[#0284c7] mr-1">{currency}</span>
                    {(d.value || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCitySales = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const maxVal = Math.max(...reportData.map(d => d.value || 0), 1);
    const pillPalette = [
      'bg-sky-100/85 text-sky-800 border-sky-200/80',
      'bg-teal-100/85 text-teal-800 border-teal-200/80',
      'bg-fuchsia-100/85 text-fuchsia-800 border-fuchsia-200/80',
      'bg-amber-100/85 text-amber-800 border-amber-200/80'
    ];
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-6 shadow-[0_10px_30px_-6px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/90 border border-white shadow-xs flex items-center justify-center text-[#0284c7] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.09em]">Primary Market</p>
              <h4 className="text-[24px] font-bold text-slate-900 tracking-tight mt-0.5">{reportData[0]?.label || 'General'}</h4>
            </div>
          </div>
          <div className="rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border border-white/95 p-6 shadow-[0_10px_30px_-6px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/90 border border-white shadow-xs flex items-center justify-center text-indigo-600 shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.09em]">Unique Territories</p>
              <h4 className="text-[24px] font-bold text-slate-900 tracking-tight mt-0.5">{reportData.length} Cities</h4>
            </div>
          </div>
        </div>

        <div
          className={`rounded-[28px] border p-6 sm:p-8 transition-all duration-500 ${
            geoDark
              ? 'bg-[#201e20] border-white/15 text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)]'
              : 'bg-white border-white/95 text-slate-900 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,1)]'
          }`}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2
                className={`text-lg font-bold tracking-tight ${
                  geoDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Geographic Revenue Spread
              </h2>
              <p className={`text-[13px] mt-0.5 ${geoDark ? 'text-white/65' : 'text-slate-500'}`}>
                Market penetration analysis based on shipping city.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleGeoTheme}
              title="Switch Dark / Light Capsule Theme"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                geoDark
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
              }`}
            >
              <span className="text-[14px] font-bold leading-none">⋮</span>
            </button>
          </div>
          <div className="space-y-5">
            {reportData.map((d: any, i: number) => (
              <div key={i} className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold border ${
                      geoDark
                        ? 'bg-white/10 text-white/90 border-white/20'
                        : pillPalette[i % pillPalette.length]
                    }`}
                  >
                    <span className="opacity-60">#</span>
                    <span>{d.label || 'Unspecified'}</span>
                  </span>
                  <p
                    className={`text-[14px] font-bold tabular-nums ${
                      geoDark ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {formatCurrency(d.value || 0, currency)}
                  </p>
                </div>
                <GlassCapsuleBar
                  percentage={Math.max(15, (d.value / maxVal) * 100)}
                  darkMode={geoDark}
                  heightClass="h-4"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderOutstanding = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const totalOutstanding = reportData.reduce((sum, r) => sum + (r.balance || 0), 0);
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-rose-50 p-8 rounded-[32px] border border-rose-100 shadow-sm relative overflow-hidden group">
            <p className="text-[11px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2">Total Receivables</p>
            <h4 className="text-[32px] font-black text-rose-700 tracking-tight">{formatCurrency(totalOutstanding, currency)}</h4>
            <Receipt className="absolute -bottom-4 -right-4 w-24 h-24 text-rose-500 opacity-10" />
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm relative overflow-hidden group">
            <p className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Active Debtors</p>
            <h4 className="text-[32px] font-black text-[#162839] tracking-tight">{reportData.length}</h4>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4].map(x => <div key={x} className="w-2 h-2 rounded-full bg-rose-500/20" />)}
            </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm relative overflow-hidden">
            <p className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Risk Level</p>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${totalOutstanding > 1000000 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {totalOutstanding > 1000000 ? 'CRITICAL' : 'OPTIMAL'}
              </span>
            </div>
            <p className="text-[13px] text-neutral-400 mt-2 font-medium">Based on credit thresholds</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-neutral-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-[#162839] tracking-tight">Aged Receivables Report</h2>
              <p className="text-[14px] text-neutral-400 font-medium mt-1">Real-time status of pending customer payments.</p>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#fcfdfe]">
              <tr className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-50">
                <th className="px-10 py-6">Customer Identity</th>
                <th className="px-10 py-6">Region</th>
                <th className="px-10 py-6 text-right">Total Amount</th>
                <th className="px-10 py-6 text-right">Paid Amount</th>
                <th className="px-10 py-6 text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {reportData.map((r: any) => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-colors group">
                  <td className="px-10 py-6">
                    <p className="font-black text-[#162839] group-hover:text-rose-600 transition-colors">{r.name}</p>
                    <p className="text-[12px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">{r.phone}</p>
                  </td>
                  <td className="px-10 py-6 text-neutral-500 font-bold uppercase text-[12px] tracking-tight">{r.city}</td>
                  <td className="px-10 py-6 text-right font-black text-[#162839] text-lg">
                    {formatCurrency((r.total_debit || 0), currency)}
                  </td>
                  <td className="px-10 py-6 text-right font-black text-emerald-600 text-lg">
                    {formatCurrency((r.total_credit || 0), currency)}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <p className="font-black text-rose-500 text-lg">{formatCurrency((r.balance || 0), currency)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInventoryValuation = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="rounded-[36px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 p-10 sm:p-12 shadow-[0_16px_44px_-8px_rgba(245,158,11,0.08),inset_0_1px_2px_rgba(255,255,255,1)] relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient-to-br from-amber-300/30 via-orange-300/20 to-transparent blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-amber-50/90 border border-amber-200/80 text-[11px] font-bold text-amber-700 uppercase tracking-[0.18em] mb-4">Net Asset Value</span>
            <h4 className="text-[44px] sm:text-[52px] font-extrabold text-slate-900 tracking-tight leading-none tabular-nums">{formatCurrency((reportData.total || 0), currency)}</h4>
            <div className="mt-7 flex flex-wrap gap-6">
              <div className="px-5 py-3 rounded-2xl bg-white/80 border border-white shadow-2xs">
                <p className="text-slate-400 text-[10.5px] font-bold uppercase tracking-widest leading-none mb-1.5">Total SKUs</p>
                <p className="text-[18px] font-extrabold text-slate-900">{(reportData.items || []).length} Items</p>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-white/80 border border-white shadow-2xs">
                <p className="text-slate-400 text-[10.5px] font-bold uppercase tracking-widest leading-none mb-1.5">Audit Status</p>
                <p className="text-[18px] font-extrabold text-emerald-600">Verified</p>
              </div>
            </div>
          </div>
          <Package className="absolute -bottom-8 -right-8 w-52 h-52 text-amber-500 opacity-[0.06] pointer-events-none" />
        </div>

        <div className="glass-table-container overflow-hidden">
          <div className="p-8 border-b border-slate-200/60 bg-white/40">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Stock Valuation Audit</h2>
            <p className="text-[13.5px] text-slate-500 font-medium mt-1">Weighted average valuation across all warehouse categories.</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                <th className="px-10 py-5">Inventory Item</th>
                <th className="px-10 py-5 text-center">Unit Stock</th>
                <th className="px-10 py-5 text-right">Weighted Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {(reportData.items || []).map((i: any, idx: number) => (
                <tr key={idx} className="transition-colors">
                  <td className="px-10 py-5 font-bold text-slate-900">{i.name}</td>
                  <td className="px-10 py-5 text-center">
                    <span className="px-4 py-1.5 bg-white/85 border border-white rounded-full font-bold text-slate-800 text-[13px] shadow-2xs">{i.stock}</span>
                  </td>
                  <td className="px-10 py-5 text-right font-bold text-amber-600">{formatCurrency((i.value || 0), currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProductionSummary = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {reportData.map((s: any, i: number) => (
            <div key={i} className="rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 p-6 shadow-[0_12px_34px_-6px_rgba(15,23,42,0.055),inset_0_1px_2px_rgba(255,255,255,1)] relative overflow-hidden">
               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-3">{s.status} Batches</p>
               <div className="flex items-end justify-between">
                <h4 className={`text-[30px] font-extrabold tracking-tight ${s.status === 'Completed' ? 'text-emerald-600' : 'text-indigo-600'}`}>{s.count}</h4>
                <div className={`w-10 h-10 rounded-2xl border border-white shadow-2xs flex items-center justify-center ${s.status === 'Completed' ? 'bg-emerald-50/90 text-emerald-600' : 'bg-indigo-50/90 text-indigo-600'}`}>
                   {s.status === 'Completed' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </div>
               </div>
            </div>
          ))}
        </div>

        <div className="glass-table-container overflow-hidden">
          <div className="p-8 border-b border-slate-200/60 bg-white/40">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Factory Output Analytics</h2>
            <p className="text-[13.5px] text-slate-500 font-medium mt-1">Aggregated production efficiency by batch status.</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                <th className="px-10 py-5">Operation Status</th>
                <th className="px-10 py-5 text-center">Batch Frequency</th>
                <th className="px-10 py-5 text-right">Aggregate Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {reportData.map((s: any, i: number) => (
                <tr key={i} className="transition-colors">
                  <td className="px-10 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      s.status === 'Completed' ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80' : 'bg-indigo-50/90 text-indigo-700 border-indigo-200/80'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-10 py-5 text-center font-bold text-slate-900">{s.count}</td>
                  <td className="px-10 py-5 text-right font-extrabold text-slate-900 text-lg">{(s.total_qty || 0).toLocaleString()} <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest ml-1">PCS</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPL = () => {
    if (!reportData) return null;
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="rounded-[40px] bg-white/[0.76] backdrop-blur-3xl border-[1.5px] border-white/95 p-10 sm:p-14 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.07),inset_0_1px_2px_rgba(255,255,255,1)] text-slate-900 relative overflow-hidden mb-10">
          {/* Decorative pastel glass blobs */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-sky-300/30 via-indigo-300/20 to-transparent blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-emerald-300/25 via-cyan-300/20 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <div className="max-w-3xl mx-auto space-y-12 relative z-10 text-center">
            <div className="space-y-3">
              <span className="inline-flex items-center px-4 py-1 rounded-full bg-sky-50/90 border border-sky-200/80 text-[#0284c7] font-bold uppercase tracking-[0.2em] text-[11px]">Financial Year-to-Date Audit</span>
              <h2 className="text-[36px] sm:text-[44px] font-extrabold text-slate-900 tracking-tight leading-none">Net Performance Statement</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-[28px] bg-white/80 border border-white shadow-[0_8px_24px_rgba(16,185,129,0.06),inset_0_1px_1.5px_rgba(255,255,255,1)] space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Gross Revenue</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50/90 border border-emerald-200/80 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp size={18} />
                  </div>
                  <h4 className="text-[28px] font-extrabold text-emerald-600 tabular-nums">{formatCurrency((reportData.revenue || 0), currency)}</h4>
                </div>
              </div>
              <div className="p-6 rounded-[28px] bg-white/80 border border-white shadow-[0_8px_24px_rgba(244,63,94,0.06),inset_0_1px_1.5px_rgba(255,255,255,1)] space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Expenditure</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-rose-50/90 border border-rose-200/80 text-rose-500 rounded-2xl flex items-center justify-center">
                    <CreditCard size={18} />
                  </div>
                  <h4 className="text-[28px] font-extrabold text-rose-500 tabular-nums">{formatCurrency((reportData.expenses || 0), currency)}</h4>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <div className={`p-8 sm:p-10 rounded-[32px] border-[1.5px] border-white shadow-[0_12px_32px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,1)] ${ (reportData.netProfit || 0) >= 0 ? 'bg-gradient-to-br from-emerald-50/80 via-white/90 to-sky-50/70' : 'bg-gradient-to-br from-rose-50/80 via-white/90 to-orange-50/70'} backdrop-blur-xl`}>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.22em] mb-3">Calculated Operational Balance</p>
                 <div className="flex flex-col items-center gap-2">
                    <span className={`text-[44px] sm:text-[56px] font-extrabold leading-none tabular-nums ${(reportData.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency((reportData.netProfit || 0), currency)}
                    </span>
                    <span className={`px-5 py-1.5 rounded-full text-[11.5px] font-bold uppercase tracking-[0.16em] mt-3 border ${ (reportData.netProfit || 0) >= 0 ? 'bg-emerald-500/15 text-emerald-700 border-emerald-200' : 'bg-rose-500/15 text-rose-700 border-rose-200'}`}>
                      { (reportData.netProfit || 0) >= 0 ? 'Surplus Balance' : 'Operating Deficit' }
                    </span>
                 </div>
              </div>
            </div>
          </div>
          <DollarSign className="absolute -bottom-10 -right-10 w-64 h-64 text-slate-900 opacity-[0.025] pointer-events-none" />
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-4 p-6 glass-card rounded-[28px]">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)] shrink-0">
                 <Info size={22} className="text-[#0284c7]" />
              </div>
              <p className="text-[13.5px] font-medium text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900 uppercase text-[11px] tracking-widest block mb-0.5">Financial Integrity Note</span>
                This statement reflects real-time ledger entries. Final year-end reconciliations may introduce slight adjustments in tax provisions.
              </p>
           </div>
        </div>
      </div>
    );
  };

  const reportCards = [
    { title: 'Sales Summary', desc: 'Detailed revenue records by period', type: 'sales', icon: BarChart2, color: 'from-emerald-500 to-teal-600', textColor: 'text-emerald-500' },
    { title: 'City-wise Sales', desc: 'Geographical revenue distribution', type: 'city-sales', icon: MapPin, color: 'from-blue-500 to-indigo-600', textColor: 'text-blue-500' },
    { title: 'Outstanding', desc: 'Track pending customer receivables', type: 'outstanding', icon: Receipt, color: 'from-rose-500 to-red-600', textColor: 'text-rose-500' },
    { title: 'Inventory Value', desc: 'Current stock asset market value', type: 'inventory-valuation', icon: Package, color: 'from-amber-400 to-orange-500', textColor: 'text-amber-500' },
    { title: 'Factory Output', desc: 'Batch production efficiency summary', type: 'production-summary', icon: Factory, color: 'from-purple-500 to-fuchsia-600', textColor: 'text-purple-500' },
    { title: 'Profit & Loss', desc: 'Core revenue vs purchase balance', type: 'profit-loss', icon: DollarSign, color: 'from-slate-700 to-slate-900', textColor: 'text-slate-800' },
  ];

  if (activeReport !== 'main') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-4">
            <button onClick={() => setActiveReport('main')} className="w-10 h-10 glass-pill-button rounded-full flex items-center justify-center text-slate-600 hover:text-[#0284c7] transition-all cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight capitalize">
              {activeReport.replace('-', ' ')} Report
            </h1>
          </div>
          <div className="flex gap-3">
             <button onClick={handlePrint} className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 glass-pill-button px-5 py-2.5 rounded-full cursor-pointer">
               <Printer className="w-4 h-4 text-[#0284c7]" />
               <span>Print</span>
             </button>
             <button 
               onClick={handleExportCSV}
               className="flex items-center gap-2 text-[13px] font-semibold text-white bg-gradient-to-r from-[#0284c7] to-sky-500 px-6 py-2.5 rounded-full shadow-[0_6px_20px_rgba(2,132,199,0.28)] hover:brightness-105 transition-all cursor-pointer"
             >
               <Download className="w-4 h-4" />
               <span>Export CSV</span>
             </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-20 text-center text-neutral-400 animate-pulse font-bold">Generating Data...</div>
        ) : (
          <>
            {activeReport === 'sales' && renderSalesItems()}
            {activeReport === 'city-sales' && renderCitySales()}
            {activeReport === 'outstanding' && renderOutstanding()}
            {activeReport === 'inventory-valuation' && renderInventoryValuation()}
            {activeReport === 'production-summary' && renderProductionSummary()}
            {activeReport === 'profit-loss' && renderPL()}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Reports</span>
          </nav>
          <h2 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">Reports & Analytics</h2>
          <p className="text-[16px] text-neutral-500 mt-1">Select a report module to analyze real-time performance metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reportCards.map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -6, shadow: '0 20px 35px -10px rgba(15,23,42,0.1)' }}
            className="flex flex-col glass-card p-7 sm:p-8 rounded-[30px] transition-all group relative overflow-hidden h-full"
          >
            <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-6 shadow-md shadow-sky-500/10 group-hover:scale-105 transition-transform`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-[20px] font-bold text-slate-900 tracking-tight mb-2 leading-tight">{card.title}</h3>
            <p className="text-[13.5px] text-slate-500 font-medium leading-relaxed mb-8">{card.desc}</p>
            
            <button 
              onClick={() => fetchReport(card.type as ReportView)}
              className={`mt-auto inline-flex items-center gap-2 ${card.textColor} font-bold text-[12px] uppercase tracking-[0.16em] group/btn cursor-pointer`}
            >
              Analyze Data
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </button>

            {/* Decorative background icon */}
            <card.icon className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-900 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Stats Column */}
        <div className="flex-1 space-y-8">
          {/* Custom Report Builder */}
          <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <Settings2 className="w-5 h-5 text-[#0284c7]" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Custom Report Builder</h3>
                <p className="text-[13px] text-slate-500 font-medium">Configure and generate tailored data exports.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Data Source</label>
                <div className="relative">
                  <GlassSelect 
                    value={selectedModule}
                    onChange={e => setSelectedModule(e.target.value)}
                  >
                    <option value="sales">Sales Orders</option>
                    <option value="production">Production Logs</option>
                    <option value="inventory">Inventory Ledger</option>
                    <option value="transfers">Stock Transfers</option>
                    <option value="customers">Customer Behavior</option>
                  </GlassSelect>
                </div>
              </div>
              <div className="space-y-2 text-slate-400">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em] block">Date Range</label>
                <div className="relative">
                  <GlassSelect disabled>
                    <option>Last 30 Days (Implicit)</option>
                  </GlassSelect>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Export Format</label>
                <button type="button" className="w-full py-3 px-4 text-[13px] font-semibold rounded-2xl glass-pill-button text-[#0284c7] flex items-center justify-center">
                  CSV Export
                </button>
              </div>
              <button 
                onClick={handleExportClick}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold flex items-center justify-center gap-2 hover:brightness-105 transition-all shadow-[0_6px_20px_rgba(2,132,199,0.28)] text-[13.5px] cursor-pointer"
              >
                <FileOutput className="w-4 h-4" />
                <span>Generate CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
