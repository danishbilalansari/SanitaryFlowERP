import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, ArrowLeft,
  ChevronRight, ArrowRight, Truck, MapPin, Calendar, Clock,
  Download, Eye, CheckCircle2, AlertCircle, RefreshCw, Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppContext } from '../store';
import { CardListSkeleton, GlassEmptyState, GlassModal } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

interface Transfer {
  id: number;
  transfer_number: string;
  source: string;
  destination: string;
  priority: string;
  transport_type: string;
  expected_arrival?: string;
  notes?: string;
  status: string;
  items_preview?: string;
  created_at: string;
  updated_at: string;
}

export default function TransferHistory() {
  const navigate = useNavigate();
  const cachedTransfers = peekApiCache<Transfer[]>('/api/inventory/transfers', 60_000);
  const [transfers, setTransfers] = useState<Transfer[]>(() => Array.isArray(cachedTransfers) ? cachedTransfers : []);
  const [loading, setLoading] = useState<boolean>(() => !Array.isArray(cachedTransfers));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const filterBarRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
        setShowDateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    cachedJsonFetch<Transfer[]>('/api/inventory/transfers', { credentials: 'include' }, 60_000)
      .then(data => {
        setTransfers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/inventory/transfers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        invalidateApiCache('/api/inventory/transfers');
        invalidateApiCache('/api/inventory');
        invalidateApiCache('/api/shop/dashboard');
        setTransfers(transfers.map(t => t.id === id ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransferDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/inventory/transfers/${id}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
      setSelectedTransfer(data);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-neutral-100 text-neutral-500 border-neutral-200';
      case 'PENDING APPROVAL': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'IN TRANSIT': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'RECEIVED': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-neutral-100 text-neutral-500 border-neutral-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'URGENT' ? 'text-red-500' : 'text-neutral-400';
  };

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch =
      t.transfer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || (t.status || '').toUpperCase() === statusFilter.toUpperCase();

    let matchesDate = true;
    if (dateFilter !== 'All Time') {
      const tDate = new Date(t.created_at);
      const now = new Date();
      if (dateFilter === 'Today') {
        matchesDate = tDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'Last 7 Days') {
        const threshold = new Date();
        threshold.setDate(now.getDate() - 7);
        matchesDate = tDate >= threshold;
      } else if (dateFilter === 'Last 30 Days') {
        const threshold = new Date();
        threshold.setDate(now.getDate() - 30);
        matchesDate = tDate >= threshold;
      } else if (dateFilter === 'This Month') {
        matchesDate = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const { showToast } = useAppContext();

  const handleExport = () => {
    if (!transfers || transfers.length === 0) {
      showToast?.('No transfer logs to export', 'error');
      return;
    }

    const headers = ['Transfer #', 'Source', 'Destination', 'Status', 'Priority', 'Transport', 'Date'];
    const rows = filteredTransfers.map(t => [
      t.transfer_number,
      t.source,
      t.destination,
      t.status,
      t.priority,
      t.transport_type,
      new Date(t.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Transfer_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Transfer logs exported successfully', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-slate-400 mb-2">
            <Link to="/inventory" className="hover:text-[#0284c7] transition-colors">Inventory</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/inventory/transfer" className="hover:text-[#0284c7] transition-colors">Stock Transfer</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#0284c7] font-bold">Transfer History</span>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/90 border border-white flex items-center justify-center shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:bg-white transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h2 className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">Transfer Tracking</h2>
              <p className="text-[15px] text-slate-500 mt-1">Monitor all active and historical stock movements.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setLoading(true);
              invalidateApiCache('/api/inventory/transfers');
              cachedJsonFetch<Transfer[]>('/api/inventory/transfers', { credentials: 'include' }, 30_000)
                .then(data => {
                  setTransfers(Array.isArray(data) ? data : []);
                  setLoading(false);
                })
                .catch(err => {
                  console.error(err);
                  setLoading(false);
                });
            }}
            className="w-10 h-10 glass-pill-button rounded-full flex items-center justify-center text-slate-600 hover:text-[#0284c7] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 glass-pill-button text-slate-700 font-semibold rounded-full text-[13.5px]"
          >
            <Download className="w-4 h-4 text-[#0284c7]" />
            Export Log
          </button>
          <Link 
            to="/inventory/transfer"
            className="flex items-center gap-2 px-5 py-2.5 glass-pill-button text-slate-900 font-semibold rounded-full text-[13.5px]"
          >
            <Plus className="w-4 h-4 text-[#0284c7]" />
            New Transfer
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div ref={filterBarRef} className="glass-search-toolbar relative z-40 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0284c7] transition-colors pointer-events-none z-10" />
          <input 
            type="text" 
            placeholder="Search by transfer ID, source, or destination..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/90 rounded-full text-[13.5px] font-medium text-slate-800 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] outline-none transition-all"
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
              className="w-full justify-center flex items-center gap-2 px-5 py-2.5 glass-pill-button rounded-full text-[13px] font-semibold text-slate-700 whitespace-nowrap cursor-pointer"
            >
              <Filter className="w-4 h-4 text-[#0284c7]" />
              <span>Status: {statusFilter === 'All' ? 'All' : statusFilter}</span>
            </button>
            {showStatusMenu && (
              <div className="absolute top-full right-0 mt-2 w-52 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                {['All', 'DRAFT', 'PENDING APPROVAL', 'IN TRANSIT', 'RECEIVED'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setShowStatusMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                      statusFilter === status ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    {status === 'All' ? 'All Statuses' : status}
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
              className="w-full justify-center flex items-center gap-2 px-5 py-2.5 glass-pill-button rounded-full text-[13px] font-semibold text-slate-700 whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#0284c7]" />
              <span>{dateFilter}</span>
            </button>
            {showDateMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                {['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'All Time'].map(range => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setDateFilter(range);
                      setShowDateMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                      dateFilter === range ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="grid gap-4">
        {loading ? (
          <CardListSkeleton count={4} />
        ) : filteredTransfers.length === 0 ? (
          <div className="glass-card rounded-[28px]">
            <GlassEmptyState
              isSearch={Boolean(searchQuery || statusFilter !== 'All' || dateFilter !== 'All Time')}
              title={searchQuery || statusFilter !== 'All' || dateFilter !== 'All Time' ? 'No matching transfer records' : 'No transfer records yet'}
              description="No stock transfers match your current search or filter settings."
              onReset={(searchQuery || statusFilter !== 'All' || dateFilter !== 'All Time') ? () => { setSearchQuery(''); setStatusFilter('All'); setDateFilter('All Time'); } : undefined}
            />
          </div>
        ) : filteredTransfers.map((t) => {
          return (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[28px] overflow-hidden transition-all group"
            >
              <div className="p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Status Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  t.status === 'RECEIVED' ? 'bg-emerald-50/90 border-emerald-200/80' : 
                  t.status === 'IN TRANSIT' ? 'bg-sky-50/90 border-sky-200/80' : 'bg-white/90 border-white'
                }`}>
                  {t.status === 'RECEIVED' ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : 
                   t.status === 'IN TRANSIT' ? <Truck className="w-6 h-6 text-[#0284c7]" /> : 
                   <Clock className="w-6 h-6 text-slate-400" />}
                </div>

                {/* Main Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[18px] font-bold text-[#162839]">{t.transfer_number}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                    {t.priority === 'URGENT' && (
                      <span className="flex items-center gap-1 text-red-500 text-[10px] font-black uppercase tracking-widest">
                        <AlertCircle className="w-3 h-3" /> Urgent
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[13px] text-neutral-500">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      {t.source}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-300" />
                    <div className="flex items-center gap-1.5 font-medium text-[#162839]">
                      <MapPin className="w-3.5 h-3.5 text-[#006397]" />
                      {t.destination}
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="lg:px-8 lg:border-x border-[#edeeef] flex flex-col justify-center">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Items</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-bold text-[#162839]">
                      {(() => {
                        try {
                          const parsed = JSON.parse(t.items_preview || '[]');
                          if (!Array.isArray(parsed) || parsed.length === 0) return 'No items';
                          const preview = parsed.slice(0, 2).map((i: any) => `${i.qty} units`).join(', ');
                          return parsed.length > 2 ? `${preview} ...` : preview;
                        } catch (e) {
                          return 'Error parsing items';
                        }
                      })()}
                    </p>
                  </div>
                </div>

                {/* Logistics */}
                <div className="lg:w-48 space-y-1">
                  <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                    <Truck className="w-3.5 h-3.5" />
                    {t.transport_type === 'in-house' ? 'Fleet A-12' : 'Lalamove'}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {t.status === 'PENDING APPROVAL' && (
                    <button 
                      onClick={() => updateStatus(t.id, 'IN TRANSIT')}
                      className="px-4 py-2 bg-[#006397] text-white text-[12px] font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Ship Now
                    </button>
                  )}
                  {t.status === 'IN TRANSIT' && (
                    <button 
                      onClick={() => updateStatus(t.id, 'RECEIVED')}
                      className="px-4 py-2 bg-green-600 text-white text-[12px] font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                      Mark Received
                    </button>
                  )}
                  <button 
                    onClick={() => fetchTransferDetails(t.id)}
                    className="p-2.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-[#006397] transition-all"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <GlassModal
        isOpen={Boolean(isModalOpen && selectedTransfer)}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-2xl w-full"
      >
        {selectedTransfer && (
          <div className="flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
                  <Truck className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span className="text-[13px] font-semibold text-slate-800">{selectedTransfer.transfer_number}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${getStatusColor(selectedTransfer.status)}`}>
                  {selectedTransfer.status}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Route Info */}
              <div className="flex items-center justify-between p-5 bg-white/90 rounded-2xl border border-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
                <div className="text-center flex-1">
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source</p>
                  <p className="text-[15px] font-bold text-slate-900">{selectedTransfer.source}</p>
                </div>
                <div className="px-6 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100/80 border border-sky-200 flex items-center justify-center shadow-2xs">
                    <Truck className="w-5 h-5 text-[#0284c7]" />
                  </div>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                  <p className="text-[15px] font-bold text-slate-900">{selectedTransfer.destination}</p>
                </div>
              </div>

              {/* Logistics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/90 border border-white p-4 shadow-2xs">
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">Transport Method</p>
                  <p className="text-[14px] font-bold text-slate-900 capitalize mt-0.5">{selectedTransfer.transport_type || 'Internal Fleet'}</p>
                </div>
                <div className="rounded-2xl bg-white/90 border border-white p-4 shadow-2xs text-right">
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">Priority Level</p>
                  <p className={`text-[14px] font-bold uppercase mt-0.5 ${selectedTransfer.priority === 'URGENT' ? 'text-rose-500' : 'text-slate-900'}`}>
                    {selectedTransfer.priority}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-2xl bg-white/90 border border-white p-4 shadow-2xs space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-2">Transferred Items</h4>
                <div className="divide-y divide-slate-100">
                  {Array.isArray((selectedTransfer as any).items) ? (selectedTransfer as any).items.map((item: any, idx: number) => (
                    <div key={idx} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="text-[14px] font-bold text-slate-900">{item.name}</p>
                        <p className="text-[12px] text-slate-400 font-mono">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full bg-sky-100/85 text-sky-800 text-[12px] font-semibold">
                          {item.qty} units
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="py-4 text-slate-400 text-center italic">Loading items detail...</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedTransfer.notes && (
                <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200/80">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <History className="w-3 h-3" /> Personnel Notes
                  </p>
                  <p className="text-[13px] text-amber-900 leading-relaxed">{selectedTransfer.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-4 border-t border-slate-200/60 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-white/90 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)] flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#0284c7]" />
                <span>Download Receipt</span>
              </button>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
