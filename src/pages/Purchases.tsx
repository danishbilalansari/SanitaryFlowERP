import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Printer, 
  MoreVertical, 
  Download, 
  CreditCard, 
  Clock, 
  ShieldCheck, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAppContext } from '../store';
import { TableSkeletonRows, GlassEmptyState } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

export default function Purchases() {
  const { showToast, currentUser, currency } = useAppContext();
  const cachedPurchases = peekApiCache<any[]>('/api/purchases', 60_000);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>(() => Array.isArray(cachedPurchases) ? cachedPurchases : []);
  const [loading, setLoading] = useState<boolean>(() => !Array.isArray(cachedPurchases));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);

  const fetchPurchases = (forceRefresh = false) => {
    if (forceRefresh) {
      invalidateApiCache('/api/purchases');
    }
    cachedJsonFetch<any[]>('/api/purchases', { credentials: 'include' }, 60_000)
      .then(data => {
        setPurchaseOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to fetch purchase orders', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RECEIVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'ORDERED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'PAID': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'DRAFT': return 'bg-neutral-100 text-neutral-500 border-neutral-200';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-neutral-50 text-neutral-400 border-neutral-100';
    }
  };

  const filteredOrders = React.useMemo(() => {
    return purchaseOrders.filter(po => {
      // Status filter
      const matchesStatus = statusFilter === 'All Statuses' || po.status?.toUpperCase() === statusFilter.toUpperCase();
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (String(po.id).toLowerCase() || '').includes(searchLower) ||
        (po.po_number && po.po_number.toLowerCase().includes(searchLower)) || 
        (po.supplier_name && po.supplier_name.toLowerCase().includes(searchLower));

      // Date filter
      let matchesDate = true;
      if (dateRange !== 'All Time') {
        const poDate = new Date(po.created_at);
        const now = new Date();
        if (dateRange === 'Today') {
          matchesDate = poDate.toDateString() === now.toDateString();
        } else if (dateRange === 'Last 7 Days') {
          const threshold = new Date();
          threshold.setDate(now.getDate() - 7);
          matchesDate = poDate >= threshold;
        } else if (dateRange === 'Last 30 Days') {
          const threshold = new Date();
          threshold.setDate(now.getDate() - 30);
          matchesDate = poDate >= threshold;
        } else if (dateRange === 'This Month') {
          matchesDate = poDate.getMonth() === now.getMonth() && poDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [purchaseOrders, statusFilter, searchQuery, dateRange]);

  const totalPages = React.useMemo(() => {
    return Math.ceil(filteredOrders.length / itemsPerPage);
  }, [filteredOrders.length]);

  const currentItems = React.useMemo(() => {
    return filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalSpend = React.useMemo(() => {
    return purchaseOrders.reduce((acc, po) => acc + (po.total_cost || 0), 0);
  }, [purchaseOrders]);

  const pendingOrders = React.useMemo(() => {
    return purchaseOrders.filter(po => po.status !== 'RECEIVED' && po.status !== 'PAID').length;
  }, [purchaseOrders]);

  const handleExport = () => {
    if (!purchaseOrders || purchaseOrders.length === 0) {
      showToast('No purchase data to export', 'error');
      return;
    }

    const headers = ['PO #', 'Date', 'Supplier', 'Items', 'Total Cost', 'Status', 'Delivery Date'];
    const rows = filteredOrders.map(po => [
      po.po_number,
      po.date,
      po.supplier_name,
      po.items_count,
      po.total_cost,
      po.status,
      po.delivery_date || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Purchases_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Purchase report exported successfully', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/" className="hover:text-[#0284c7] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0284c7] font-bold">Purchases</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">Purchase Orders</h2>
          <p className="text-sm text-slate-600">Manage inventory procurement and supplier invoices.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-5 py-2.5 glass-pill-button text-slate-800 font-semibold text-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <Link to="/purchases/add" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold shadow-[0_4px_16px_rgba(2,132,199,0.3)] hover:brightness-105 transition-all text-xs">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Purchase</span>
          </Link>
        </div>
      </div>

      {/* Header Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-4 glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-[#0284c7] uppercase tracking-[0.08em]">Net Procurement</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-white flex items-center justify-center text-[#0284c7] shadow-2xs"><CreditCard className="w-4 h-4" /></div>
          </div>
          {loading ? (
            <div className="h-8 w-36 rounded-full bg-slate-200/80 animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none tabular-nums">{formatCurrency(totalSpend, currency)}</div>
          )}
          <p className="mt-2 text-xs text-slate-500 font-medium">Total value of all purchase orders</p>
        </div>

        <div className="md:col-span-4 glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.08em]">Active Invoices</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-white flex items-center justify-center text-indigo-600 shadow-2xs"><Clock className="w-4 h-4" /></div>
          </div>
          {loading ? (
            <div className="h-8 w-16 rounded-full bg-slate-200/80 animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none tabular-nums">{pendingOrders}</div>
          )}
          <p className="mt-2 text-xs text-slate-500 font-medium">Orders awaiting delivery or payment</p>
        </div>

        <div className="md:col-span-4 glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.08em]">Quick Access</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-white flex items-center justify-center text-emerald-600 shadow-2xs"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Link to="/suppliers" className="text-slate-900 hover:text-[#0284c7] font-bold text-[15px] flex items-center justify-between group">
              <span>Manage Suppliers</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#0284c7]" />
            </Link>
            <Link to="/purchases/raw-materials" className="text-slate-500 hover:text-slate-900 font-medium text-xs">View Raw Material Stock</Link>
          </div>
        </div>
      </div>

      {/* Filter Controls — Apple iOS 26 Liquid Glass Search Toolbar */}
      <div 
        className="glass-search-toolbar relative z-40"
        onMouseLeave={() => {
          setShowStatusMenu(false);
          setShowDateMenu(false);
        }}
      >
        <div className="flex flex-col md:flex-row gap-3.5 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0284c7] transition-colors pointer-events-none z-10" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by PO Number or Supplier..."
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
                <span>Status: {statusFilter === 'All Statuses' ? 'All' : statusFilter}</span>
              </button>
              {showStatusMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                  {['All Statuses', 'Ordered', 'Received', 'Paid'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${statusFilter === status ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'}`}
                    >
                      {status}
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
      </div>

      {/* Data Table in Apple iOS 26 Liquid Glass */}
      <div className="glass-table-container relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Total Cost</th>
                <th className="px-6 py-4 text-right">Paid</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13.5px]">
              {loading ? (
                <TableSkeletonRows columns={8} rows={6} />
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <GlassEmptyState
                      isSearch={Boolean(searchQuery || statusFilter !== 'All Statuses' || dateRange !== 'All Time')}
                      title={searchQuery || statusFilter !== 'All Statuses' ? 'No matching purchase orders' : 'No purchase orders yet'}
                      description="Try clearing your search or widening the date filter to view historical purchase orders."
                      onReset={(searchQuery || statusFilter !== 'All Statuses' || dateRange !== 'All Time') ? () => { setSearchQuery(''); setStatusFilter('All Statuses'); setDateRange('All Time'); } : undefined}
                    />
                  </td>
                </tr>
              ) : currentItems.map((po, i) => {
                const total = po.total_cost || 0;
                const paid = po.paid_amount || 0;
                const balance = total - paid;
                return (
                <tr key={i} className="group">
                  <td className="px-6 py-4 font-bold text-[#0284c7] font-mono group-hover:underline cursor-pointer">
                    <Link to={`/purchases/${po.id}`}>{po.po_number}</Link>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{po.supplier_name}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium tabular-nums">
                    {new Date(po.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-900 tabular-nums">
                    {formatCurrency(total, currency)}
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-emerald-600 tabular-nums">
                    {formatCurrency(paid, currency)}
                  </td>
                  <td className={`px-6 py-4 text-right font-extrabold tabular-nums ${balance > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {formatCurrency(Math.abs(balance), currency)} {balance > 0 && '(Cr)'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[11px] font-semibold rounded-full border ${getStatusStyles(po.status)}`}>
                      {po.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       {po.status !== 'Received' && (
                         <button 
                         onClick={() => {
                           if (window.confirm(`Mark this PO as Received and record full payment of ${formatCurrency(balance, currency)}?`)) {
                             fetch(`/api/purchases/${po.id}`, {
                               method: 'PATCH',
                               headers: { 
                                 'Content-Type': 'application/json',
                                 'x-user-id': currentUser?.id?.toString() || '1'
                               },
                               body: JSON.stringify({
                                 additional_payment: balance,
                                 status: 'Received'
                                }),
                                credentials: 'include'
                              }).then(async res => {
                                if (res.ok) { 
                                  invalidateApiCache('/api/purchases');
                                  invalidateApiCache('/api/suppliers');
                                  invalidateApiCache('/api/inventory');
                                  invalidateApiCache('/api/ledger');
                                  showToast('Purchase settled successfully!', 'success');
                                  fetchPurchases(true);
                                } else {
                                  const err = await res.json();
                                  showToast(err.error || 'Failed to record payment', 'error');
                                }
                              }).catch(err => {
                                console.error(err);
                                showToast('Network error', 'error');
                              });
                            }
                         }}
                         className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white/85 hover:bg-white border border-white text-emerald-600 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all" title="Record Payment">
                           <DollarSign className="w-4 h-4" />
                        </button>
                       )}
                      <Link to={`/purchases/${po.id}`} className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white/85 hover:bg-white border border-white text-slate-500 hover:text-[#0284c7] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/[0.45] backdrop-blur-xl border-t border-white/90 flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-bold text-slate-900">{filteredOrders.length}</span> orders
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
    </div>
  );
}

