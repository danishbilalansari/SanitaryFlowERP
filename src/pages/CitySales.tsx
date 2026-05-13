import React from 'react';
import { 
  ChevronRight, 
  Map,
  FileDown
} from 'lucide-react';
import { useAppContext } from '../store';
import { Link } from 'react-router-dom';

export default function CitySales() {
  const { sales, customers } = useAppContext();

  // Combine sales with city data
  const cityTracking = customers.map(customer => {
    const customerSales = sales.filter(s => s.customerId === customer.id);
    const totalRevenue = customerSales.reduce((acc, s) => acc + s.total, 0);
    return {
      city: customer.city,
      totalRevenue,
      orderCount: customerSales.length
    };
  }).reduce((acc, current) => {
    const existing = acc.find(c => c.city === current.city);
    if (existing) {
      existing.totalRevenue += current.totalRevenue;
      existing.orderCount += current.orderCount;
    } else {
      acc.push({ city: current.city, totalRevenue: current.totalRevenue, orderCount: current.orderCount });
    }
    return acc;
  }, [] as { city: string, totalRevenue: number, orderCount: number }[]);

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
        <div className="xl:col-span-8 bg-white rounded-2xl border border-[#edeeef] shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#edeeef]">
             <h3 className="text-[18px] font-black text-[#162839] tracking-tight">Detailed Performance Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f8f9fa] border-b border-[#edeeef]">
                <tr>
                  <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest">City Name</th>
                  <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest">Total Orders</th>
                  <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edeeef]">
                {cityTracking.map((cityData) => (
                  <tr key={cityData.city} className="hover:bg-[#f8f9fa]/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-[#162839]">{cityData.city}</td>
                    <td className="px-8 py-6 text-neutral-500 font-medium">{cityData.orderCount}</td>
                    <td className="px-8 py-6 font-black text-[#162839]">Rs. {cityData.totalRevenue.toLocaleString()}</td>
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
