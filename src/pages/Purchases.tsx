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

export default function Purchases() {
  const { showToast, currentUser } = useAppContext();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);

  useEffect(() => {
    fetch('/api/purchases', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) throw new Error('Not JSON response');
        return res.json();
      })
      .then(data => {
        setPurchaseOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to fetch purchase orders', 'error');
        setLoading(false);
      });
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RECEIVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'ORDERED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'PAID': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'DRAFT': return 'bg-neutral-100 text-neutral-500 border-neutral-200';
      default: return 'bg-neutral-50 text-neutral-400 border-neutral-100';
    }
  };

  const filteredOrders = purchaseOrders.filter(po => {
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

  const totalSpend = purchaseOrders.reduce((acc, po) => acc + (po.total_cost || 0), 0);
  const pendingOrders = purchaseOrders.filter(po => po.status !== 'RECEIVED' && po.status !== 'PAID').length;

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Purchases</span>
          </nav>
          <h2 className="text-[28px] sm:text-[32px] font-black text-[#001d31] tracking-tight leading-none">Purchase Orders</h2>
          <p className="text-[14px] sm:text-[16px] text-neutral-500 mt-1">Manage inventory procurement and invoices.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-white border border-neutral-200 text-neutral-900 font-bold rounded-lg hover:bg-neutral-50 transition-all text-[14px] shadow-sm"
          >
            <Download className="w-4 h-4 text-neutral-400" />
            Export
          </button>
          <Link to="/purchases/add" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg transition-all text-[14px]">
            <Plus className="w-4 h-4" />
            New Purchase
          </Link>
        </div>
      </div>

      {/* Header Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest text-[#006397]">Net Procurement</span>
            <div className="p-3 bg-blue-50 text-[#006397] rounded-xl"><CreditCard className="w-5 h-5" /></div>
          </div>
          <div className="text-[32px] font-bold text-[#162839] leading-none">${totalSpend.toLocaleString()}</div>
          <p className="mt-2 text-[13px] text-neutral-400 font-medium">Total value of all purchase orders</p>
        </div>

        <div className="md:col-span-4 bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest text-indigo-500">Active Invoices</span>
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl"><Clock className="w-5 h-5" /></div>
          </div>
          <div className="text-[32px] font-bold text-[#162839] leading-none">{pendingOrders}</div>
          <p className="mt-2 text-[13px] text-neutral-400 font-medium tracking-tight">Orders awaiting delivery or payment</p>
        </div>

        <div className="md:col-span-4 bg-[#162839] p-8 rounded-2xl shadow-xl border border-[#162839]">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Quick Access</span>
              <div className="p-3 bg-white/10 text-white rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
            </div>
            <div className="flex flex-col gap-2">
               <Link to="/suppliers" className="text-white hover:text-[#5cb8fd] font-bold text-[18px] flex items-center justify-between group">
                  Manage Suppliers <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </Link>
               <Link to="/purchases/raw-materials" className="text-white/60 hover:text-white font-medium text-[14px]">View Raw Material Stock</Link>
            </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-[#f3f4f5] border border-[#edeeef] p-4 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#006397] transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="PO Number or Supplier..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[14px] focus:ring-2 focus:ring-[#5cb8fd]/20 focus:border-[#5cb8fd] outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto relative">
            <div className="relative flex-1 md:flex-none">
              <button 
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="w-full justify-center flex items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap"
              >
                <Filter className="w-4 h-4 text-neutral-400" />
                Status: {statusFilter === 'All Statuses' ? 'All' : statusFilter}
              </button>
              {showStatusMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#edeeef] rounded-xl shadow-xl z-50 overflow-hidden">
                  {['All Statuses', 'Ordered', 'Received', 'Paid'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-[13px] font-bold transition-colors hover:bg-neutral-50 ${statusFilter === status ? 'text-[#006397] bg-blue-50/50' : 'text-neutral-600'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-1 md:flex-none">
              <button 
                onClick={() => setShowDateMenu(!showDateMenu)}
                className="w-full justify-center flex items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 text-neutral-400" />
                {dateRange}
              </button>
              {showDateMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#edeeef] rounded-xl shadow-xl z-50 overflow-hidden">
                  {['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'All Time'].map(range => (
                    <button
                      key={range}
                      onClick={() => {
                        setDateRange(range);
                        setShowDateMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-[13px] font-bold transition-colors hover:bg-neutral-50 ${dateRange === range ? 'text-[#006397] bg-blue-50/50' : 'text-neutral-600'}`}
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

      {/* Data Table */}
      <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f8f9fa] text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-[#edeeef]">
                <th className="px-8 py-5">PO Number</th>
                <th className="px-8 py-5">Supplier</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5 text-right">Total Cost</th>
                <th className="px-8 py-5 text-right">Paid</th>
                <th className="px-8 py-5 text-right">Balance</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[14px] divide-y divide-[#edeeef]">
              {loading ? (
                <tr><td colSpan={8} className="px-8 py-20 text-center text-neutral-400 italic">Loading purchase history...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={8} className="px-8 py-20 text-center text-neutral-400 italic">No purchase orders found.</td></tr>
              ) : filteredOrders.map((po, i) => {
                const total = po.total_cost || 0;
                const paid = po.paid_amount || 0;
                const balance = total - paid;
                return (
                <tr key={i} className="hover:bg-[#f8f9fa] transition-colors group">
                  <td className="px-8 py-5 font-bold text-[#006397] group-hover:underline cursor-pointer">
                    <Link to={`/purchases/${po.id}`}>{po.po_number}</Link>
                  </td>
                  <td className="px-8 py-5 font-bold text-[#162839]">{po.supplier_name}</td>
                  <td className="px-8 py-5 text-neutral-500 font-medium">
                    {new Date(po.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-[#162839] tracking-tight">
                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-emerald-600 tracking-tight">
                    ${paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-8 py-5 text-right font-black tracking-tight ${balance > 0 ? 'text-red-500' : 'text-neutral-500'}`}>
                    ${Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {balance > 0 && '(Cr)'}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider ${getStatusStyles(po.status)}`}>
                      {po.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       {po.status !== 'Received' && ( // assuming 'Received' means fully paid or just status
                         <button 
                         onClick={() => {
                           if (window.confirm(`Mark this PO as Received and record full payment of $${balance.toFixed(2)}?`)) {
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
                                  showToast('Purchase settled successfully!', 'success');
                                  setTimeout(() => window.location.reload(), 500);
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
                         className="p-1.5 text-neutral-900 font-bold hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Record Payment">
                           <DollarSign className="w-4 h-4" />
                        </button>
                       )}
                      <Link to={`/purchases/${po.id}`} className="p-1.5 text-neutral-300 hover:text-[#006397] hover:bg-neutral-100 rounded-lg transition-all inline-block">
                        <MoreVertical className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

