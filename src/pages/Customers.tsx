import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit2, 
  CreditCard,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  History,
  Calendar,
  Map
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { TableSkeletonRows, GlassEmptyState, GlassCapsuleBar } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache } from '../lib/apiCache';

export default function Customers() {
  const { currency } = useAppContext();
  const navigate = useNavigate();
  const cachedCustomers = peekApiCache<any[]>('/api/customers', 60_000);
  const cachedCityData = peekApiCache<any[]>('/api/reports/customer-summary-city-wise', 60_000);
  const [customers, setCustomers] = useState<any[]>(() => Array.isArray(cachedCustomers) ? cachedCustomers : []);
  const [loading, setLoading] = useState<boolean>(() => !Array.isArray(cachedCustomers));
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [dateRange, setDateRange] = useState('All Time');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const [viewMode, setViewMode] = useState<'list' | 'city'>('list');
  const [cityData, setCityData] = useState<any[]>(() => Array.isArray(cachedCityData) ? cachedCityData : []);
  const [cityLoading, setCityLoading] = useState<boolean>(() => !Array.isArray(cachedCityData));

  useEffect(() => {
    cachedJsonFetch<any[]>('/api/customers', { credentials: 'include' }, 60_000)
      .then(data => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching customers:', err);
        setLoading(false);
      });

    cachedJsonFetch<any[]>('/api/reports/customer-summary-city-wise', { credentials: 'include' }, 60_000)
      .then(data => {
        setCityData(Array.isArray(data) ? data : []);
        setCityLoading(false);
      })
      .catch(err => {
        console.error('Error fetching city data:', err);
        setCityLoading(false);
      });
  }, []);

  let totalOutstanding = 0;
  let outstandingCount = 0;
  
  cityData.forEach(c => {
    const sales = Number(c.total_sales) || 0;
    const payments = Number(c.total_purchases_payments) || 0;
    const balance = sales - payments;
    if (balance > 0) {
      totalOutstanding += balance;
      outstandingCount++;
    }
  });

  const stats = [
    { label: 'Total Customers', value: customers.length.toString(), trend: 'Active baseline', trendColor: 'text-[#006397]', isLoading: loading },
    { label: 'Active Orders', value: '42', trend: '8 pending shipment', trendColor: 'text-[#006397]', isLoading: loading },
    { label: 'Outstanding Total', value: formatCurrency(totalOutstanding, currency), trend: `Across ${outstandingCount} customers`, trendColor: 'text-neutral-500', isLoading: cityLoading },
    { label: 'Collection Rate', value: '94.2%', trend: '94.2%', progress: true, isLoading: false },
  ];

  const filteredCustomers = customers.filter(c => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(searchLower) ||
      (c.company && c.company.toLowerCase().includes(searchLower)) ||
      (c.phone && c.phone.toLowerCase().includes(searchLower)) ||
      (c.email && c.email.toLowerCase().includes(searchLower)) ||
      (c.city && c.city.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === 'All' ||
      (c.status || 'Active').toLowerCase() === statusFilter.toLowerCase();

    // Date filter (based on created_at)
    let matchesDate = true;
    if (dateRange !== 'All Time') {
      const cDate = new Date(c.created_at);
      const now = new Date();
      if (dateRange === 'Today') {
        matchesDate = cDate.toDateString() === now.toDateString();
      } else if (dateRange === 'Last 30 Days') {
        const threshold = new Date();
        threshold.setDate(now.getDate() - 30);
        matchesDate = cDate >= threshold;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const currentItems = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    if (!customers || customers.length === 0) {
      alert('No customer data to export.');
      return;
    }

    const headers = ['Name', 'Company', 'Email', 'Phone', 'City', 'Type', 'Credit Limit', 'Created At'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.company || 'N/A',
      c.email,
      c.phone,
      c.city,
      c.customer_type || 'Regular',
      c.credit_limit,
      c.created_at
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Customers_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & New Customer Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/" className="hover:text-[#0284c7] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0284c7] font-bold">Customers</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">Customer Registry</h2>
          <p className="text-sm text-slate-600">Manage your client base, city distribution and financial records.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 glass-pill-button text-slate-800 font-semibold text-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <Link 
            to="/customers/add"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white text-xs font-semibold hover:brightness-105 transition-all shadow-[0_4px_16px_rgba(2,132,199,0.3)]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-6 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] leading-none">{stat.label}</span>
            {stat.isLoading ? (
              <>
                <div className="h-8 w-28 rounded-full bg-slate-200/80 animate-pulse mt-0.5" />
                <div className="h-4 w-32 rounded-full bg-slate-100 animate-pulse mt-1" />
              </>
            ) : (
              <>
                <span className={`text-2xl font-extrabold tabular-nums ${stat.label === 'Outstanding Total' ? 'text-rose-500' : 'text-slate-900'}`}>{stat.value}</span>
                {stat.progress ? (
                  <div className="mt-2.5">
                    <GlassCapsuleBar pct={parseFloat(stat.trend) || 0} mode="light" height={12} />
                  </div>
                ) : (
                  <span className={`text-xs font-semibold flex items-center gap-1 mt-1 ${stat.trendColor}`}>
                    {stat.label === 'Total Customers' && <TrendingUp className="w-3 h-3" />}
                    {stat.label === 'Active Orders' && <Clock className="w-3 h-3" />}
                    {stat.trend}
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Filter Bar — Apple iOS 26 Liquid Glass Search Toolbar */}
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
            placeholder="Search customers by name, company, city or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-3 rounded-full text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2.5 w-full md:w-auto relative">
          <button 
            type="button"
            onClick={() => setViewMode(viewMode === 'list' ? 'city' : 'list')}
            className={`flex-1 md:flex-none justify-center items-center gap-2 px-4 py-3 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap flex cursor-pointer ${
              viewMode === 'city'
                ? 'bg-gradient-to-r from-[#0284c7] to-sky-500 text-white shadow-[0_4px_14px_rgba(2,132,199,0.3)]'
                : 'glass-pill-button text-slate-800'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>{viewMode === 'list' ? 'City-Wise View' : 'List View'}</span>
          </button>
          
          <div className="relative flex-1 md:flex-none">
            <button 
              type="button"
              onClick={() => {
                setShowStatusMenu(!showStatusMenu);
                setShowDateMenu(false);
              }}
              className="w-full justify-center items-center gap-2 px-4 py-3 glass-pill-button text-[13px] font-semibold text-slate-700 whitespace-nowrap flex cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>Status: {statusFilter}</span>
            </button>
            {showStatusMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                {['All', 'Active', 'Inactive'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                        setStatusFilter(s);
                        setShowStatusMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${statusFilter === s ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'}`}
                  >
                    {s}
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
              className="w-full justify-center items-center gap-2 px-4 py-3 glass-pill-button text-[13px] font-semibold text-slate-700 whitespace-nowrap flex cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>{dateRange}</span>
            </button>
            {showDateMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                {['Today', 'Last 30 Days', 'All Time'].map(range => (
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

      {viewMode === 'city' ? (
        <div className="space-y-6">
          {cityLoading ? (
            <div className="glass-table-container">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="text-[13.5px]">
                    <TableSkeletonRows columns={4} rows={5} />
                  </tbody>
                </table>
              </div>
            </div>
          ) : Object.entries(
            cityData.reduce((acc, curr) => {
              const city = curr.city || 'Unknown City';
              if (!acc[city]) acc[city] = [];
              acc[city].push(curr);
              return acc;
            }, {} as Record<string, any[]>)
          ).map(([city, customersGroup]: [string, any]) => (
            <div key={city} className="glass-table-container">
              <div className="bg-white/[0.45] backdrop-blur-xl border-b border-white/90 px-6 py-4">
                <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                  <Map className="w-4 h-4 text-[#0284c7]"/> 
                  <span>{city}</span>
                  <span className="text-[11px] font-bold text-[#0284c7] bg-sky-100/80 border border-sky-200 px-2.5 py-0.5 rounded-full ml-1">
                    {customersGroup.length}
                  </span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4 text-right">Total Sales</th>
                      <th className="px-6 py-4 text-right">Payments / Purchases</th>
                      <th className="px-6 py-4 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13.5px]">
                    {customersGroup.map((c) => {
                      const sales = Number(c.total_sales) || 0;
                      const payments = Number(c.total_purchases_payments) || 0;
                      const balance = sales - payments;
                      return (
                        <tr key={c.id} className="group">
                          <td className="px-6 py-4">
                            <Link to={`/customers/${c.id}`} className="block font-bold text-slate-900 hover:text-[#0284c7] leading-tight">
                              {c.name}
                            </Link>
                            {c.company && <p className="text-[11.5px] text-slate-400 mt-0.5 font-medium">{c.company}</p>}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-900 tabular-nums">{formatCurrency(sales, currency)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-emerald-600 tabular-nums">{formatCurrency(payments, currency)}</td>
                          <td className={`px-6 py-4 text-right font-extrabold tabular-nums ${balance > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
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
          {!cityLoading && cityData.length === 0 && (
             <div className="glass-card rounded-[28px]">
               <GlassEmptyState
                 title="No city-grouped customer data"
                 description="City distribution records will appear once customer accounts and invoices are added."
               />
             </div>
          )}
        </div>
      ) : (
        <div className="glass-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">City & Type</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4 text-right">Credit Limit</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13.5px]">
                {loading ? (
                  <TableSkeletonRows columns={5} rows={6} />
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <GlassEmptyState
                        isSearch={Boolean(searchQuery || statusFilter !== 'All' || dateRange !== 'All Time')}
                        title={searchQuery || statusFilter !== 'All' || dateRange !== 'All Time' ? 'No matching customers found' : 'No customers yet'}
                        description="Try adjusting your search query, status, or date filter."
                        onReset={(searchQuery || statusFilter !== 'All' || dateRange !== 'All Time') ? () => { setSearchQuery(''); setStatusFilter('All'); setDateRange('All Time'); } : undefined}
                      />
                    </td>
                  </tr>
                ) : currentItems.map((customer) => (
                  <tr key={customer.id} className="group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-2xl bg-sky-100/80 border border-white text-[#0284c7] flex items-center justify-center font-bold text-xs shadow-2xs">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <Link to={`/customers/${customer.id}`} className="block font-bold text-slate-900 leading-tight hover:text-[#0284c7]">
                            {customer.name}
                          </Link>
                          <p className="text-[11.5px] text-slate-400 mt-0.5 font-medium">{customer.company || 'No Company'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-bold leading-none">{customer.city || 'No City'}</p>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-white/90 border border-white rounded-full text-[10px] font-semibold text-slate-600 shadow-2xs">
                        {customer.business_type || 'Retailer'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-medium leading-none">{customer.email || 'N/A'}</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium tabular-nums">{customer.phone || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency((customer.credit_limit || 0), currency)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link to={`/customers/${customer.id}`} className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:text-[#0284c7] bg-white/80 hover:bg-white border border-white rounded-full shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/customers/edit/${customer.id}`} className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:text-[#0284c7] bg-white/80 hover:bg-white border border-white rounded-full shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-white/[0.45] backdrop-blur-xl border-t border-white/90 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500">
                Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-bold text-slate-900">{filteredCustomers.length}</span> customers
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
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${currentPage === page ? 'bg-gradient-to-r from-[#0284c7] to-sky-500 text-white shadow-[0_4px_12px_rgba(2,132,199,0.3)]' : 'border border-white bg-white/75 hover:bg-white text-slate-700'}`}
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
      )}
    </div>
  );
}
