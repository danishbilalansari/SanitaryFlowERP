import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft,
  Map,
  FileDown
} from 'lucide-react';
import { useAppContext } from '../store';
import { Link } from 'react-router-dom';
import { cachedJsonFetch, peekApiCache } from '../lib/apiCache';

export default function CitySales() {
  const { currency, showToast } = useAppContext();

  const cachedCityData = peekApiCache<any[]>('/api/reports/customer-summary-city-wise', 60_000);
  const [cityData, setCityData] = useState<any[]>(() => Array.isArray(cachedCityData) ? cachedCityData : []);
  const [loading, setLoading] = useState<boolean>(() => !Array.isArray(cachedCityData));

  useEffect(() => {
    cachedJsonFetch<any[]>('/api/reports/customer-summary-city-wise', { credentials: 'include' }, 60_000)
      .then(data => {
        setCityData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const cityTracking: any[] = Object.values(cityData.reduce((acc, curr) => {
    const city = curr.city || 'Unknown City';
    if (!acc[city]) {
      acc[city] = { city, totalRevenue: 0, orderCount: 0, customers: [] };
    }
    const sales = Number(curr.total_sales) || 0;
    acc[city].totalRevenue += sales;
    acc[city].orderCount += 1;
    acc[city].customers.push(curr);
    return acc;
  }, {} as Record<string, any>));

  const sortedTopCities = [...cityTracking].sort((a, b) => b.totalRevenue - a.totalRevenue);

  const handleExport = () => {
    if (!cityTracking || cityTracking.length === 0) {
      showToast?.('No city data to export', 'error');
      return;
    }

    const headers = ['City Name', 'Total Orders', `Revenue (${currency})`];
    const rows = cityTracking.map(cityData => [
      cityData.city,
      cityData.orderCount,
      cityData.totalRevenue
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `City_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('City sales report exported successfully', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-4">
          <Link 
            to="/sales" 
            className="mt-1 w-10 h-10 glass-pill-button rounded-full flex items-center justify-center text-slate-600 hover:text-[#0284c7] transition-all"
            title="Back to Sales"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <nav className="flex items-center gap-2 text-[13px] font-medium text-slate-400 mb-2">
              <Link to="/" className="hover:text-[#0284c7] transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to="/sales" className="hover:text-[#0284c7] transition-colors">Sales</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#0284c7] font-bold">City Tracking</span>
            </nav>
            <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-none mb-2">City-wise Sales</h1>
            <p className="text-[15px] text-slate-500">Real-time geographic distribution of factory and shop performance.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 glass-pill-button text-slate-800 font-semibold rounded-full transition-all text-[13px] cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#0284c7]" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Top Performing Cities Card */}
        <div className="xl:col-span-4 glass-card p-7 sm:p-8 rounded-[30px] flex flex-col h-[420px]">
          <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
              <Map className="w-5 h-5 text-[#0284c7]" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Top Cities</h3>
              <p className="text-[13px] text-slate-500 font-medium">Ranked by total revenue</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-1">
             {loading ? (
               Array.from({ length: 4 }).map((_, idx) => (
                 <div key={idx} className="h-12 rounded-2xl bg-slate-200/70 animate-pulse" />
               ))
             ) : sortedTopCities.slice(0, 6).map((cityData, index) => (
               <div key={cityData.city} className="flex items-center justify-between p-3.5 bg-white/70 rounded-2xl border border-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:bg-white transition-all">
                  <div className="flex items-center gap-3.5">
                    <span className="text-[15px] font-bold text-[#0284c7] opacity-60 w-6">0{index+1}</span>
                    <p className="font-semibold text-slate-900 text-[14px]">{cityData.city}</p>
                  </div>
                  <p className="font-bold text-[#0284c7] text-[14px]">{formatCurrency(cityData.totalRevenue, currency)}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Detailed Performance Ledger */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="flex justify-between items-end px-1">
            <div>
              <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Detailed Performance Ledger</h3>
              <p className="text-[13px] text-slate-500 font-medium">Breakdown of customer sales and balance by region</p>
            </div>
            {loading ? (
              <div className="h-6 w-28 rounded-full bg-slate-200/80 animate-pulse" />
            ) : (
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 rounded-full bg-white/80 border border-white shadow-sm">{cityTracking.length} Cities Covered</p>
            )}
          </div>

          {loading ? (
            <div className="glass-card rounded-[28px] p-8 space-y-4">
              <div className="h-8 w-44 rounded-full bg-slate-200/80 animate-pulse" />
              <div className="h-32 w-full rounded-2xl bg-slate-200/60 animate-pulse" />
            </div>
          ) : cityTracking.map((cityData) => (
            <div key={cityData.city} className="glass-table-container rounded-[28px] overflow-hidden flex flex-col">
              <div className="bg-white/40 backdrop-blur-md border-b border-slate-200/60 px-7 py-4 flex justify-between items-center">
                 <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2.5">
                   <div className="w-8 h-8 rounded-xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-sm">
                     <Map className="w-4 h-4 text-[#0284c7]"/> 
                   </div>
                   {cityData.city}
                 </h3>
                 <div className="flex gap-4">
                   <div className="text-right">
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</p>
                     <p className="text-[15px] font-bold text-slate-900">{formatCurrency(cityData.totalRevenue, currency)}</p>
                   </div>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200/60">
                      <th className="px-7 py-3.5">Customer Name</th>
                      <th className="px-7 py-3.5 text-right">Total Sales</th>
                      <th className="px-7 py-3.5 text-right">Payments</th>
                      <th className="px-7 py-3.5 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13.5px] divide-y divide-slate-100/80">
                    {cityData.customers.map((c: any) => {
                      const sales = Number(c.total_sales) || 0;
                      const payments = Number(c.total_purchases_payments) || 0;
                      const balance = sales - payments;
                      return (
                        <tr key={c.id} className="group hover:bg-white/60 transition-colors">
                          <td className="px-7 py-4">
                            <Link to={`/customers/${c.id}`} className="block font-semibold text-slate-900 hover:text-[#0284c7] leading-tight transition-colors">
                              {c.name}
                            </Link>
                            {c.company && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{c.company}</p>}
                          </td>
                          <td className="px-7 py-4 text-right font-medium text-slate-800">{formatCurrency(sales, currency)}</td>
                          <td className="px-7 py-4 text-right font-semibold text-emerald-600">{formatCurrency(payments, currency)}</td>
                          <td className={`px-7 py-4 text-right font-bold ${balance > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                            {formatCurrency(Math.abs(balance), currency)} {balance > 0 && '(Dr)'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {!loading && cityTracking.length === 0 && (
            <div className="p-12 text-center text-slate-500 glass-card rounded-[28px]">
              No city sales data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
