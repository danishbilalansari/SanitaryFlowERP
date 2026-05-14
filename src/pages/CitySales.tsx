import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft,
  Map,
  FileDown
} from 'lucide-react';
import { useAppContext } from '../store';
import { Link } from 'react-router-dom';

export default function CitySales() {
  const { sales, customers } = useAppContext();

  const [cityData, setCityData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/reports/customer-summary-city-wise')
      .then(res => res.json())
      .then(data => setCityData(data))
      .catch(console.error);
  }, []);

  const cityTracking: any[] = Object.values(cityData.reduce((acc, curr) => {
    const city = curr.city || 'Unknown City';
    if (!acc[city]) {
      acc[city] = { city, totalRevenue: 0, orderCount: 0, customers: [] };
    }
    const sales = Number(curr.total_sales) || 0;
    acc[city].totalRevenue += sales;
    // Assuming we don't have orderCount per customer in this API, let's just use 1 or count customers
    acc[city].orderCount += 1;
    acc[city].customers.push(curr);
    return acc;
  }, {} as Record<string, any>));

  const sortedTopCities = [...cityTracking].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const { showToast } = useAppContext();

  const handleExport = () => {
    if (!cityTracking || cityTracking.length === 0) {
      showToast?.('No city data to export', 'error');
      return;
    }

    const headers = ['City Name', 'Total Orders', 'Revenue (Rs)'];
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
            className="mt-1 p-2 bg-white border border-[#edeeef] hover:bg-neutral-50 rounded-xl transition-colors text-neutral-500 shadow-sm"
            title="Back to Sales"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
              <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to="/sales" className="hover:text-[#006397] transition-colors">Sales</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#006397] font-bold">City Tracking</span>
            </nav>
            <h1 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none mb-2">City-wise Sales</h1>
            <p className="text-[16px] text-neutral-500">Real-time geographic distribution of factory and shop performance.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#c4c6cd] text-[#162839] font-bold rounded-lg hover:bg-neutral-50 transition-all text-[14px] shadow-sm uppercase tracking-widest text-[11px]"
          >
            <FileDown className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Top Performing Cities Card */}
        <div className="xl:col-span-4 bg-white p-6 rounded-2xl border border-[#edeeef] shadow-sm flex flex-col h-[400px]">
          <h3 className="text-[18px] font-black text-[#162839] mb-6 tracking-tight">Top Performing Cities</h3>
          <div className="flex flex-col gap-4 overflow-y-auto">
             {sortedTopCities.slice(0, 6).map((cityData, index) => (
               <div key={cityData.city} className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-xl border border-[#edeeef]">
                  <div className="flex items-center gap-4">
                    <span className="text-[24px] font-black text-[#006397] opacity-20">0{index+1}</span>
                    <p className="font-bold text-[#162839]">{cityData.city}</p>
                  </div>
                  <p className="font-black text-[#006397]">Rs. {cityData.totalRevenue.toLocaleString()}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Detailed Performance Ledger */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <h3 className="text-[18px] font-black text-[#162839] tracking-tight">Detailed Performance Ledger</h3>
            <p className="text-[13px] font-bold text-neutral-400 uppercase tracking-widest">{cityTracking.length} Cities Covered</p>
          </div>

          {cityTracking.map((cityData) => (
            <div key={cityData.city} className="bg-white rounded-2xl border border-[#edeeef] shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#f8f9fa] border-b border-[#edeeef] px-6 py-4 flex justify-between items-center">
                 <h3 className="text-[16px] font-black text-[#162839] flex items-center gap-2">
                   <Map className="w-4 h-4 text-[#006397]"/> 
                   {cityData.city}
                 </h3>
                 <div className="flex gap-4">
                   <div className="text-right">
                     <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Total Sales</p>
                     <p className="text-[14px] font-black text-[#162839]">Rs. {cityData.totalRevenue.toLocaleString()}</p>
                   </div>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                      <th className="px-6 py-3">Customer Name</th>
                      <th className="px-6 py-3 text-right">Total Sales</th>
                      <th className="px-6 py-3 text-right">Payments</th>
                      <th className="px-6 py-3 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] divide-y divide-[#edeeef]">
                    {cityData.customers.map((c: any) => {
                      const sales = Number(c.total_sales) || 0;
                      const payments = Number(c.total_purchases_payments) || 0;
                      const balance = sales - payments;
                      return (
                        <tr key={c.id} className="group hover:bg-[#f8f9fa]/50 transition-colors">
                          <td className="px-6 py-4">
                            <Link to={`/customers/${c.id}`} className="block font-bold text-[#162839] hover:text-[#006397] leading-tight transition-colors">
                              {c.name}
                            </Link>
                            {c.company && <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">{c.company}</p>}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-[#162839]">Rs. {sales.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-medium text-emerald-600">Rs. {payments.toLocaleString()}</td>
                          <td className={`px-6 py-4 text-right font-bold ${balance > 0 ? 'text-red-500' : 'text-neutral-500'}`}>
                            Rs. {Math.abs(balance).toLocaleString()} {balance > 0 && '(Dr)'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {cityTracking.length === 0 && (
            <div className="p-12 text-center text-neutral-500 border border-[#edeeef] bg-white rounded-xl shadow-sm">
              No city sales data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
