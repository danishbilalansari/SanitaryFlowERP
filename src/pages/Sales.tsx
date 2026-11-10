import { formatCurrency } from '../lib/currency';
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
import { TableSkeletonRows, GlassEmptyState } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

export default function Sales() {
  const { showToast, currentUser, currency } = useAppContext();
  const cachedSales = peekApiCache<any[]>('/api/sales', 60_000);
  const cachedStats = peekApiCache<any>('/api/sales/stats', 60_000);
  const [sales, setSales] = useState<any[]>(() => Array.isArray(cachedSales) ? cachedSales : []);
  const [stats, setStats] = useState(() => cachedStats || {
    totalRevenue: 0,
    ordersToday: 0,
    todayRevenue: 0,
    topProduct: 'N/A',
    topProductQty: 0
  });

  const [loading, setLoading] = useState<boolean>(() => !(Array.isArray(cachedSales) && cachedStats));
  const [activeTab, setActiveTab] = useState('All Sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchSalesData = (forceRefresh = false) => {
    if (forceRefresh) {
      invalidateApiCache('/api/sales');
      invalidateApiCache('/api/sales/stats');
    }
    Promise.all([
      cachedJsonFetch<any[]>('/api/sales', { credentials: 'include' }, 60_000),
      cachedJsonFetch<any>('/api/sales/stats', { credentials: 'include' }, 60_000)
    ]).then(([salesData, statsData]) => {
      setSales(Array.isArray(salesData) ? salesData : []);
      if (statsData) setStats(statsData);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch sales data:', err);
      showToast('Failed to load sales data', 'error');
      setLoading(false);
    });
  };
  
  useEffect(() => {
    fetchSalesData();
  }, []);
  
  const handlePrintStatement = () => {
    window.print();
  };

  const handleExport = () => {
    if (!sales || sales.length === 0) {
      showToast('No sales data to export', 'error');
      return;
    }

    const headers = ['Order Number', 'Date', 'Customer', 'Items', 'Total', 'Status'];
    const rows = filteredSales.map(sale => [
      sale.order_number || sale.id,
      sale.created_at,
      sale.customer_name,
      sale.items_count || 0,
      sale.total_amount,
      sale.status
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

  const kpis: any[] = [
    { 
      label: 'TOTAL REVENUE (ALL)', 
      value: `${formatCurrency((stats.totalRevenueOverall || stats.totalRevenue || 0), currency)}`, 
      trend: '', 
      trendColor: 'text-green-600', 
      trendBg: 'bg-green-50',
      icon: DollarSign,
      id: 'kpi-revenue'
    },
    { 
      label: 'TOP PRODUCT (MTD)', 
      value: stats.topProduct, 
      subValue: `${stats.topProductQty} units sold`,
      icon: Star,
      id: 'kpi-product'
    },
    { 
      label: 'ORDERS TODAY', 
      value: (stats.ordersToday || 0).toString(), 
      subValue: `Revenue: ${formatCurrency((stats.todayRevenue || 0), currency)}`,
      icon: ShoppingBag,
      id: 'kpi-orders'
    }
  ];

  const filteredSales = React.useMemo(() => {
    return sales.filter(sale => {
      if (!sale) return false;
      
      // Status filter
      let matchesTab = activeTab === 'All Sales';
      if (!matchesTab) {
        if (activeTab === 'Pending') {
          matchesTab = sale.status?.toLowerCase() === 'pending' || sale.status?.toLowerCase() === 'processing';
        } else {
          matchesTab = sale.status?.toLowerCase() === activeTab.toLowerCase();
        }
      }
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (String(sale.id).toLowerCase() || '').includes(searchLower) ||
        (sale.order_number && sale.order_number.toLowerCase().includes(searchLower)) ||
        (sale.customer_name && sale.customer_name.toLowerCase().includes(searchLower));

      // Date filter
      let matchesDate = true;
      if (dateRange !== 'All Time') {
        const saleDate = new Date(sale.created_at);
        const now = new Date();
        if (dateRange === 'Today') {
          matchesDate = saleDate.toDateString() === now.toDateString();
        } else if (dateRange === 'Last 7 Days') {
          const threshold = new Date();
          threshold.setDate(now.getDate() - 7);
          matchesDate = saleDate >= threshold;
        } else if (dateRange === 'Last 30 Days') {
          const threshold = new Date();
          threshold.setDate(now.getDate() - 30);
          matchesDate = saleDate >= threshold;
        } else if (dateRange === 'This Month') {
          matchesDate = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        }
      }
      
      return matchesTab && matchesSearch && matchesDate;
    });
  }, [sales, activeTab, searchQuery, dateRange]);

  const totalPages = React.useMemo(() => {
    return Math.ceil(filteredSales.length / itemsPerPage);
  }, [filteredSales.length]);

  const currentItems = React.useMemo(() => {
    return filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredSales, currentPage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-blue-600 font-bold">Sales & Orders</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">Sales Hub</h1>
          <p className="text-sm text-slate-600">Commercial transactions, customer orders and revenue tracking.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link 
            to="/sales/tracking/city"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white text-slate-800 font-semibold rounded-2xl border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all text-xs"
          >
            <span>City Tracking</span>
          </Link>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white text-slate-800 font-semibold rounded-2xl border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all text-xs"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <Link 
            to="/sales/add"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl border border-white/40 shadow-[0_4px_16px_rgba(10,132,255,0.35)] backdrop-blur-md transition-all text-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi) => (
          <motion.div 
            key={kpi.id} 
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative overflow-hidden p-6 rounded-3xl bg-white/[0.72] backdrop-blur-2xl border border-white/85 shadow-[0_12px_30px_-6px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11.5px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-600 border border-blue-400/20 shadow-sm">
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              {loading ? (
                <>
                  <div className="h-8 w-36 rounded-full bg-slate-200/80 animate-pulse" />
                  <div className="h-4 w-28 rounded-full bg-slate-200/70 animate-pulse mt-2.5" />
                </>
              ) : (
                <>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none text-slate-900 tabular-nums">
                    {kpi.value}
                  </h3>
                  {kpi.subValue && (
                    <p className="text-xs font-semibold mt-2 text-blue-600">
                      {kpi.subValue}
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters — Apple iOS 26 Liquid Glass Toolbar */}
      <div 
        className="glass-search-toolbar relative z-40 flex flex-col md:flex-row gap-3.5 items-center"
        onMouseLeave={() => {
          setShowStatusMenu(false);
          setShowDateMenu(false);
        }}
      >
        <div className="relative flex-1 group w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0284c7] transition-colors pointer-events-none z-10" />
          <input 
            type="text" 
            placeholder="Search by sale ID or customer name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-3 rounded-full text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2.5 w-full md:w-auto relative">
          <div className="relative flex-1 md:flex-none">
            <button 
              type="button"
              onClick={() => {
                setShowStatusMenu(!showStatusMenu);
                setShowDateMenu(false);
              }}
              className="w-full justify-center flex items-center gap-2 px-4 py-3 glass-pill-button text-[13px] font-semibold text-slate-700 whitespace-nowrap cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>Status: {activeTab === 'All Sales' ? 'All' : activeTab}</span>
            </button>
            {showStatusMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                {['All Sales', 'Pending', 'Completed'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      setShowStatusMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${activeTab === tab ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'}`}
                  >
                    {tab === 'All Sales' ? 'All Statuses' : tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-1 md:flex-none">
            <button 
              type="button"
              onClick={() => {
                setShowDateMenu(!showDateMenu);
                setShowStatusMenu(false);
              }}
              className="w-full justify-center flex items-center gap-2 px-4 py-3 glass-pill-button text-[13px] font-semibold text-slate-700 whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>{dateRange}</span>
            </button>
            {showDateMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                {['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'All Time'].map(range => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setDateRange(range);
                      setShowDateMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${dateRange === range ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Table Section in Apple iOS 26 Liquid Glass */}
      <div className="glass-table-container relative z-10 flex flex-col">
        {/* Table Controls (Segmented Pill Tabs) */}
        <div className="px-6 py-4 border-b border-white/90 bg-white/[0.45] backdrop-blur-xl flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-slate-200/50 border border-white/90">
            {['All Sales', 'Pending', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)]' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            {filteredSales.length} {filteredSales.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-4">Sale ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Paid</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows columns={8} rows={6} />
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <GlassEmptyState
                      isSearch={Boolean(searchQuery || activeTab !== 'All Sales' || dateRange !== 'All Time')}
                      title={searchQuery || activeTab !== 'All Sales' ? 'No matching sales found' : 'No sales recorded yet'}
                      description="Try clearing your search or widening the date range to see more sales records."
                      onReset={(searchQuery || activeTab !== 'All Sales' || dateRange !== 'All Time') ? () => { setSearchQuery(''); setActiveTab('All Sales'); setDateRange('All Time'); } : undefined}
                    />
                  </td>
                </tr>
              ) : currentItems.map((sale) => {
                const total = sale.total_amount || 0;
                const paid = sale.paid_amount || 0;
                const balance = total - paid;
                return (
                <tr key={sale.id} className="group">
                  <td className="px-6 py-4 text-[13.5px] font-bold text-slate-900 font-mono">{sale.order_number || sale.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-[11px] bg-sky-100/80 text-[#0284c7] border border-white shadow-2xs">
                        {sale.customer_name?.substring(0, 2).toUpperCase() || 'CU'}
                      </div>
                      <span className="text-[13.5px] font-bold text-slate-900">{sale.customer_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-500 font-medium tabular-nums">
                    {new Date(sale.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-[13.5px] font-extrabold text-slate-900 tabular-nums">{formatCurrency(total, currency)}</td>
                  <td className="px-6 py-4 text-[13.5px] font-extrabold text-emerald-600 tabular-nums">{formatCurrency(paid, currency)}</td>
                  <td className={`px-6 py-4 text-[13.5px] font-extrabold tabular-nums ${balance > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{formatCurrency(Math.abs(balance), currency)} {balance > 0 && '(Dr)'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[11px] font-semibold rounded-full border ${
                      sale.status?.toLowerCase() === 'completed' ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80' :
                      sale.status?.toLowerCase() === 'pending' || sale.status?.toLowerCase() === 'processing' ? 'bg-amber-50/90 text-amber-700 border-amber-200/80' :
                      'bg-rose-50/90 text-rose-700 border-rose-200/80'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {sale.status?.toLowerCase() !== 'completed' && (
                        <button 
                         onClick={() => {
                           if (window.confirm(`Complete this sale by recording full remaining payment of ${formatCurrency(balance, currency)}?`)) {
                             fetch(`/api/sales/${sale.id}`, {
                               method: 'PATCH',
                               headers: { 
                                 'Content-Type': 'application/json',
                                 'x-user-id': currentUser?.id?.toString() || '1'
                               },
                               body: JSON.stringify({
                                 additional_payment: balance,
                                 status: 'Completed'
                               }),
                               credentials: 'include'
                             }).then(async res => {
                               const contentType = res.headers.get('content-type');
                               if (res.ok) { 
                                 invalidateApiCache('/api/sales');
                                 invalidateApiCache('/api/customers');
                                 invalidateApiCache('/api/ledger');
                                 invalidateApiCache('/api/reports/customer-summary-city-wise');
                                 invalidateApiCache('/api/shop/dashboard');
                                 showToast('Sale completed successfully!', 'success');
                                 fetchSalesData(true);
                               } else {
                                 const text = await res.text();
                                 let errorMsg = 'Failed to complete sale';
                                 if (contentType && contentType.includes('application/json')) {
                                   try {
                                     const err = JSON.parse(text);
                                     errorMsg = err.error || errorMsg;
                                   } catch (e) {}
                                 }
                                 showToast(errorMsg, 'error');
                               }
                             }).catch(err => {
                               console.error(err);
                               showToast('Network error', 'error');
                             });
                           }
                         }}
                         className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white/85 hover:bg-white border border-white text-[#0284c7] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all" title="Complete Sale & Record Full Payment">
                            <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                      
                      <Link to={`/invoice/${sale.id}`} className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white/85 hover:bg-white border border-white text-slate-600 hover:text-[#0284c7] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all" title="View Invoice">
                        <Printer className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/90 flex justify-between items-center bg-white/[0.45] backdrop-blur-xl">
            <span className="text-xs font-medium text-slate-500">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredSales.length)}</span> of <span className="font-bold text-slate-900">{filteredSales.length}</span> sales
            </span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white bg-white/85 hover:bg-white text-slate-600 transition-all disabled:opacity-35 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${currentPage === page ? 'bg-gradient-to-r from-[#0284c7] to-sky-500 text-white shadow-[0_4px_12px_rgba(2,132,199,0.3)]' : 'bg-white/75 hover:bg-white border border-white text-slate-700'}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white bg-white/85 hover:bg-white text-slate-600 transition-all disabled:opacity-35 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
