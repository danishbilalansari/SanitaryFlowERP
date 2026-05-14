import React, { useState } from 'react';
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
  const { showToast } = useAppContext();
  const [activeReport, setActiveReport] = useState<ReportView>('main');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState('daily');
  const [selectedModule, setSelectedModule] = useState('sales');

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
      headers = ['Label', 'Value (Rs)'];
      rows = reportData.map((d: any) => [d.label, d.value]);
    } else if (activeReport === 'outstanding') {
      headers = ['Customer Name', 'Phone', 'City', 'Balance (Rs)'];
      rows = reportData.map((d: any) => [d.name, d.phone, d.city, d.balance]);
    } else if (activeReport === 'inventory-valuation') {
      headers = ['Item Name', 'Unit Stock', 'Weighted Value (Rs)'];
      rows = (reportData.items || []).map((i: any) => [i.name, i.stock, i.value]);
    } else if (activeReport === 'production-summary') {
      headers = ['Status', 'Efficiency (Batch Count)', 'Total Units (PCS)'];
      rows = reportData.map((s: any) => [s.status, s.count, s.total_qty]);
    } else if (activeReport === 'profit-loss') {
      headers = ['Category', 'Amount (Rs)'];
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
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm relative overflow-hidden group">
            <p className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Total Period Revenue</p>
            <h4 className="text-[32px] font-black text-[#162839] tracking-tight">Rs {totalRevenue.toLocaleString()}</h4>
            <BarChart2 className="absolute -bottom-4 -right-4 w-24 h-24 text-emerald-500 opacity-[0.05]" />
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm relative overflow-hidden group">
            <p className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Avg. Per {salesPeriod.replace('ly', '')}</p>
            <h4 className="text-[32px] font-black text-[#162839] tracking-tight">Rs {Math.round(totalRevenue / (reportData.length || 1)).toLocaleString()}</h4>
            <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-emerald-500 opacity-[0.05]" />
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm relative overflow-hidden">
             <p className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">View Frequency</p>
             <div className="flex bg-neutral-50 p-1.5 rounded-2xl border border-neutral-100">
              {['daily', 'monthly', 'yearly'].map(p => (
                <button 
                  key={p} 
                  onClick={() => { setSalesPeriod(p); fetchReport('sales', p); }}
                  className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${salesPeriod === p ? 'bg-white text-emerald-600 shadow-md' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-neutral-50">
            <h2 className="text-xl font-black text-[#162839] tracking-tight">Sales Performance Ledger</h2>
            <p className="text-[14px] text-neutral-400 font-medium mt-1">Detailed breakdown of revenue aggregated by {salesPeriod}.</p>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#fcfdfe]">
              <tr className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-50">
                <th className="px-10 py-6">Time Period</th>
                <th className="px-10 py-6 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {reportData.map((d: any, i: number) => (
                <tr key={i} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-10 py-6 font-bold text-[#162839] group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{d.label}</td>
                  <td className="px-10 py-6 text-right font-black text-[#162839]">
                    <span className="text-emerald-600 mr-1">Rs</span>
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
    const maxVal = Math.max(...reportData.map(d => d.value || 0));
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#00476e] p-10 rounded-[32px] shadow-xl relative overflow-hidden">
            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Primary Market</p>
            <h4 className="text-[32px] font-black text-white tracking-tight">{reportData[0]?.label || 'General'}</h4>
            <p className="text-blue-200 font-bold mt-2 text-[14px]">Leading distribution channel</p>
            <MapPin className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5" />
          </div>
          <div className="bg-white p-10 rounded-[32px] border border-neutral-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Unique Territories</p>
              <h4 className="text-[32px] font-black text-[#162839] tracking-tight">{reportData.length} Cities</h4>
            </div>
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
               <PieChart className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-neutral-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-[#162839] tracking-tight">Geographic Revenue Spread</h2>
              <p className="text-[14px] text-neutral-400 font-medium mt-1">Market penetration analysis based on shipping city.</p>
            </div>
          </div>
          <div className="p-10 space-y-8">
            {reportData.map((d: any, i: number) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[16px] font-black text-[#162839] tracking-tight">{d.label || 'Unspecified'}</p>
                    <p className="text-[12px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Territory {i+1}</p>
                  </div>
                  <p className="text-[18px] font-black text-blue-600">Rs {(d.value || 0).toLocaleString()}</p>
                </div>
                <div className="w-full h-3 bg-neutral-50 rounded-full overflow-hidden border border-neutral-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.value / maxVal) * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  />
                </div>
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
            <h4 className="text-[32px] font-black text-rose-700 tracking-tight">Rs {totalOutstanding.toLocaleString()}</h4>
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
                    Rs {(r.total_debit || 0).toLocaleString()}
                  </td>
                  <td className="px-10 py-6 text-right font-black text-emerald-600 text-lg">
                    Rs {(r.total_credit || 0).toLocaleString()}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <p className="font-black text-rose-500 text-lg">Rs {(r.balance || 0).toLocaleString()}</p>
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
        <div className="bg-gradient-to-br from-amber-400 to-orange-600 p-12 rounded-[40px] shadow-2xl relative overflow-hidden text-white">
          <div className="relative z-10">
            <p className="text-[12px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Net Asset Value</p>
            <h4 className="text-[56px] font-black tracking-tight leading-none">Rs {(reportData.total || 0).toLocaleString()}</h4>
            <div className="mt-8 flex gap-8">
              <div>
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest leading-none mb-2">Total SKUs</p>
                <p className="text-[20px] font-black">{(reportData.items || []).length} Items</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest leading-none mb-2">Audit Status</p>
                <p className="text-[20px] font-black">Verified</p>
              </div>
            </div>
          </div>
          <Package className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-10" />
        </div>

        <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-neutral-50">
            <h2 className="text-xl font-black text-[#162839] tracking-tight">Stock Valuation Audit</h2>
            <p className="text-[14px] text-neutral-400 font-medium mt-1">Weighted average valuation across all warehouse categories.</p>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#fcfdfe]">
              <tr className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-50">
                <th className="px-10 py-6">Inventory Item</th>
                <th className="px-10 py-6 text-center">Unit Stock</th>
                <th className="px-10 py-6 text-right">Weighted Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {(reportData.items || []).map((i: any, idx: number) => (
                <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-10 py-6 font-black text-[#162839]">{i.name}</td>
                  <td className="px-10 py-6 text-center">
                    <span className="px-4 py-1.5 bg-neutral-50 border border-neutral-100 rounded-xl font-black text-[#162839] text-[13px]">{i.stock}</span>
                  </td>
                  <td className="px-10 py-6 text-right font-black text-amber-600">Rs {(i.value || 0).toLocaleString()}</td>
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
            <div key={i} className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm relative overflow-hidden">
               <p className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">{s.status} Batches</p>
               <div className="flex items-end justify-between">
                <h4 className={`text-[32px] font-black tracking-tight ${s.status === 'Completed' ? 'text-emerald-600' : 'text-purple-600'}`}>{s.count}</h4>
                <div className={`p-2 rounded-xl ${s.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                   {s.status === 'Completed' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </div>
               </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-neutral-50">
            <h2 className="text-xl font-black text-[#162839] tracking-tight">Factory Output Analytics</h2>
            <p className="text-[14px] text-neutral-400 font-medium mt-1">Aggregated production efficiency by batch status.</p>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#fcfdfe]">
              <tr className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-50">
                <th className="px-10 py-6">Operation Status</th>
                <th className="px-10 py-6 text-center">Batch Frequency</th>
                <th className="px-10 py-6 text-right">Aggregate Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {reportData.map((s: any, i: number) => (
                <tr key={i} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-10 py-6">
                    <span className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.15em] border ${
                      s.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-center font-black text-[#162839]">{s.count}</td>
                  <td className="px-10 py-6 text-right font-black text-[#162839] text-lg">{(s.total_qty || 0).toLocaleString()} <span className="text-[12px] text-neutral-400 font-bold uppercase tracking-widest ml-1">PCS</span></td>
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
        <div className="bg-[#162839] rounded-[48px] p-16 shadow-2xl text-white relative overflow-hidden mb-12">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/[0.03] to-transparent pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-3xl mx-auto space-y-16 relative z-10 text-center">
            <div className="space-y-4">
              <h2 className="text-[48px] font-black tracking-tight leading-none">Net Performance Statement</h2>
              <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-[12px]">Financial Year-to-Date Audit</p>
            </div>
            
            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-2">
                <p className="text-[12px] font-black text-white/30 uppercase tracking-[0.3em]">Gross Revenue</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <TrendingUp size={20} />
                  </div>
                  <h4 className="text-[32px] font-black text-emerald-400 font-mono">Rs {(reportData.revenue || 0).toLocaleString()}</h4>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[12px] font-black text-white/30 uppercase tracking-[0.3em]">Total Expenditure</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                    <CreditCard size={20} />
                  </div>
                  <h4 className="text-[32px] font-black text-rose-400 font-mono">Rs {(reportData.expenses || 0).toLocaleString()}</h4>
                </div>
              </div>
            </div>

            <div className="pt-16 border-t border-white/5">
              <div className={`p-10 rounded-[32px] border ${ (reportData.netProfit || 0) >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'} backdrop-blur-md`}>
                 <p className="text-[12px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Calculated Operational Balance</p>
                 <div className="flex flex-col items-center gap-2">
                    <span className={`text-[64px] font-black leading-none ${(reportData.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Rs {(reportData.netProfit || 0).toLocaleString()}
                    </span>
                    <span className={`px-5 py-1.5 rounded-full text-[12px] font-black uppercase tracking-[0.2em] mt-4 ${ (reportData.netProfit || 0) >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      { (reportData.netProfit || 0) >= 0 ? 'Surplus Balance' : 'Operating Deficit' }
                    </span>
                 </div>
              </div>
            </div>
          </div>
          <DollarSign className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-[0.02]" />
        </div>

        <div className="max-w-4xl mx-auto space-y-6 opacity-60">
           <div className="flex items-center gap-4 p-8 bg-white border border-neutral-100 rounded-[32px]">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                 <Info size={24} />
              </div>
              <p className="text-[14px] font-medium text-neutral-500 leading-relaxed">
                <span className="font-black text-[#162839] uppercase text-[11px] tracking-widest block mb-1">Financial Integrity Note</span>
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
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-4">
            <button onClick={() => setActiveReport('main')} className="p-2.5 bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black text-[#162839] tracking-tight capitalize">
              {activeReport.replace('-', ' ')} Report
            </h1>
          </div>
          <div className="flex gap-3">
             <button onClick={handlePrint} className="flex items-center gap-2 text-[13px] font-bold text-neutral-600 bg-white border border-neutral-200 px-6 py-2.5 rounded-xl shadow-sm hover:bg-neutral-50 transition-colors">
               <Printer className="w-4 h-4" />
               Print
             </button>
             <button 
               onClick={handleExportCSV}
               className="flex items-center gap-2 text-[13px] font-bold text-white bg-[#162839] px-6 py-2.5 rounded-xl shadow-lg hover:opacity-95 transition-opacity uppercase tracking-wider"
             >
               <Download className="w-4 h-4" />
               Export CSV
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
            whileHover={{ y: -6, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
            className="flex flex-col bg-white border border-neutral-100 rounded-[32px] p-8 shadow-sm transition-all group relative overflow-hidden h-full"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-8 shadow-lg shadow-neutral-100 group-hover:scale-110 transition-transform`}>
              <card.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-[22px] font-black text-[#162839] tracking-tight mb-2 leading-tight">{card.title}</h3>
            <p className="text-[14px] text-neutral-500 font-medium leading-relaxed mb-10">{card.desc}</p>
            
            <button 
              onClick={() => fetchReport(card.type as ReportView)}
              className={`mt-auto flex items-center gap-2 ${card.textColor} font-black text-[11px] uppercase tracking-[0.2em] group/btn`}
            >
              Analyze Data
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </button>

            {/* Decorative background icon */}
            <card.icon className="absolute -bottom-6 -right-6 w-32 h-32 text-neutral-50 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Stats Column */}
        <div className="flex-1 space-y-8">
          {/* Custom Report Builder */}
          <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-[#edeeef] flex items-center gap-4">
              <div className="p-2 bg-[#f3f4f5] rounded-xl">
                <Settings2 className="w-5 h-5 text-[#006397]" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-[#162839]">Custom Report Builder</h3>
                <p className="text-[13px] text-neutral-400 font-medium">Configure and generate tailored data exports.</p>
              </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Data Source</label>
                <div className="relative">
                  <select 
                    value={selectedModule}
                    onChange={e => setSelectedModule(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded-lg px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all appearance-none cursor-pointer"
                  >
                    <option value="sales">Sales Orders</option>
                    <option value="production">Production Logs</option>
                    <option value="inventory">Inventory Ledger</option>
                    <option value="transfers">Stock Transfers</option>
                    <option value="customers">Customer Behavior</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2 text-neutral-400">
                <label className="text-[13px] font-bold text-[#162839] block">Date Range</label>
                <div className="relative">
                  <select disabled className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded-lg px-4 py-3 text-[14px] font-medium outline-none appearance-none cursor-not-allowed">
                    <option>Last 30 Days (Implicit)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Export Format</label>
                <div className="flex gap-1.5 p-1 bg-[#f3f4f5] rounded-lg">
                  <button className="flex-1 py-3 text-[11px] font-black rounded-md bg-white text-[#006397] shadow-sm uppercase tracking-widest">CSV EXPORT</button>
                </div>
              </div>
              <button 
                onClick={handleExportClick}
                className="w-full bg-[#006397] text-white font-bold h-[48px] rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg uppercase tracking-wider text-[13px]"
              >
                <FileOutput className="w-4 h-4" />
                Generate CSV
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
