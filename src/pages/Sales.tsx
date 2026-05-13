import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Printer, 
  Download, 
  PlusCircle, 
  Eye, 
  RotateCcw, 
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  FileDown,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Star,
  Filter,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppContext } from '../store';

export default function Sales() {
  const { sales, showToast } = useAppContext();
  const [loading, setLoading] = useState(false); // Set loading to false initially
  const [activeTab, setActiveTab] = useState('All Sales');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Removed fetchSales entirely
  
  const handlePrintStatement = () => {
    window.print();
  };

  const handleExport = () => {
    if (!sales || sales.length === 0) {
      showToast('No sales data to export', 'error');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Payment Status', 'Logistics'];
    const rows = filteredSales.map(sale => [
      sale.id,
      sale.date,
      sale.customer_name,
      sale.items_count,
      sale.total,
      sale.status,
      sale.logistics_status || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sales report exported successfully', 'success');
  };

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);

  const kpis = [
    { 
      label: 'TOTAL REVENUE (MTD)', 
      value: `$${totalRevenue.toLocaleString()}`, 
      trend: '+12.5%', 
      trendColor: 'text-green-600', 
      trendBg: 'bg-green-50',
      icon: DollarSign,
      id: 'kpi-revenue'
    },
    { 
      label: 'TOP PRODUCT', 
      value: 'Industrial Basin T-800', 
      subValue: '142 units sold',
      icon: Star,
      id: 'kpi-product'
    },
    { 
      label: 'ORDERS TODAY', 
      value: sales.length.toString(), 
      subValue: `Avg. $${(totalRevenue / (sales.length || 1)).toFixed(0)} / order`,
      icon: ShoppingBag,
      id: 'kpi-orders'
    },
    { 
      label: 'PENDING RETURNS', 
      value: '12', 
      subValue: 'Action required',
      valueColor: 'text-[#ba1a1a]', 
      subValueColor: 'text-[#ba1a1a]',
      icon: RotateCcw,
      id: 'kpi-returns'
    },
  ];

  const filteredSales = sales.filter(sale => {
    if (!sale) return false;
    let matchesTab = activeTab === 'All Sales';
    if (!matchesTab) {
      if (activeTab === 'Pending') {
        matchesTab = sale.status?.toLowerCase() === 'pending' || sale.status?.toLowerCase() === 'processing';
      } else {
        matchesTab = sale.status?.toLowerCase() === activeTab.toLowerCase();
      }
    }
    
    const matchesSearch = 
      (sale.id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (sale.customer_name && sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Sales</span>
          </nav>
          <h1 className="text-[28px] sm:text-[32px] font-black text-[#001d31] tracking-tight leading-none mb-2">Sales Dashboard</h1>
          <p className="text-[14px] sm:text-[16px] text-neutral-500">Manage transactions and track performance.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link 
            to="/sales/tracking/city"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-white border border-[#c4c6cd] text-[#162839] font-bold rounded-lg hover:bg-neutral-50 transition-all text-[11px] shadow-sm uppercase tracking-widest"
          >
            Cities
          </Link>
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-white border border-[#c4c6cd] text-[#162839] font-bold rounded-lg hover:bg-neutral-50 transition-all text-[11px] shadow-sm uppercase tracking-widest"
          >
            <FileDown className="w-4 h-4" />
            Export
          </button>
          <Link 
            to="/sales/add"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-[#006397] text-white font-bold rounded-lg hover:opacity-90 transition-all text-[11px] shadow-lg uppercase tracking-widest"
          >
            <ShoppingCart className="w-4 h-4" />
            Add Sale
          </Link>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="bg-white p-6 rounded-2xl border border-[#edeeef] shadow-sm flex flex-col justify-between relative overflow-hidden h-38">
            <div className="flex justify-between items-start z-10">
              <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">{kpi.label}</span>
              {kpi.trend && (
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${kpi.trendBg} ${kpi.trendColor}`}>
                  {kpi.trend}
                </span>
              )}
            </div>
            <div className="z-10">
              <h3 className={`text-[24px] font-black tracking-tight leading-none ${kpi.valueColor || 'text-[#162839]'}`}>
                {kpi.value}
              </h3>
              {kpi.subValue && (
                <p className={`text-[13px] font-bold mt-1 ${kpi.subValueColor || 'text-[#006397]'}`}>
                  {kpi.subValue}
                </p>
              )}
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-[#162839]">
              <kpi.icon size={80} strokeWidth={3} />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-[#f3f4f5] border border-[#edeeef] p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1 group w-full">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#006397] transition-colors" />
          <input 
            type="text" 
            placeholder="Search by sale ID or customer name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[14px] focus:ring-2 focus:ring-[#5cb8fd]/20 focus:border-[#5cb8fd] outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <button className="w-full justify-center flex items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap">
              <Filter className="w-4 h-4 text-neutral-400" />
              Status: {activeTab === 'All Sales' ? 'All' : activeTab}
            </button>
          </div>
          <button className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap">
            <Calendar className="w-4 h-4 text-neutral-400" />
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Main Content: Table Section */}
      <div className="bg-white rounded-2xl border border-[#edeeef] shadow-sm overflow-hidden flex flex-col">
        {/* Table Controls (Tabs) */}
        <div className="px-6 py-4 border-b border-[#edeeef]">
          <div className="flex gap-4">
            {['All Sales', 'Pending', 'Completed', 'Returned'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative py-2 text-[13px] font-bold transition-all ${
                  activeTab === tab 
                    ? 'text-[#006397]' 
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#006397]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#edeeef]">
              <tr>
                <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest">Sale ID</th>
                <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-neutral-400 font-medium">Loading sales...</td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-neutral-400 font-medium">No sales found matching your criteria.</td>
                </tr>
              ) : filteredSales.map((sale) => (
                <tr key={sale.id} className="group hover:bg-[#f8f9fa]/50 transition-colors">
                  <td className="px-8 py-6 text-[14px] font-black text-[#162839]">{sale.id}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] shadow-sm bg-neutral-100 text-neutral-500`}>
                        {sale.customer_name?.substring(0, 2).toUpperCase() || 'CU'}
                      </div>
                      <span className="text-[14px] font-bold text-[#162839]">{sale.customer_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[14px] text-neutral-500 font-medium">
                    {new Date(sale.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-6 text-[14px] font-black text-[#162839]">${sale.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 text-[11px] font-black rounded-full uppercase tracking-widest ${
                      sale.status?.toLowerCase() === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                      sale.status?.toLowerCase() === 'pending' || sale.status?.toLowerCase() === 'processing' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      {sale.status?.toLowerCase() === 'completed' && (
                        <Link to={`/invoice/${sale.id}`} className="p-2 text-neutral-900 font-bold hover:text-[#006397] hover:bg-[#d1e4fb]/20 rounded-lg transition-all" title="View Invoice">
                          <Printer className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-6 border-t border-[#edeeef] flex justify-between items-center bg-[#f8f9fa]/50">
          <span className="text-[13px] font-bold text-neutral-400">Showing {filteredSales.length} of {sales.length} sales</span>
          <div className="flex gap-2">
            <button className="p-2 border border-[#edeeef] rounded-lg hover:bg-white transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-4 py-1 bg-[#006397] text-white rounded-lg text-[13px] font-bold shadow-md">1</button>
            <button className="p-2 border border-[#edeeef] rounded-lg hover:bg-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>


    </div>
  );
}
