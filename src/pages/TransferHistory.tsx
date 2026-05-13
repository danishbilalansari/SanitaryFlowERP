import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, ArrowLeft,
  ChevronRight, ArrowRight, Truck, MapPin, Calendar, Clock,
  Download, Eye, CheckCircle2, AlertCircle, RefreshCw, Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppContext } from '../store';

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
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/inventory/transfers')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch');
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => {
        setTransfers(data);
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

  const filteredTransfers = transfers.filter(t => 
    t.transfer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/inventory" className="hover:text-[#006397] transition-colors">Inventory</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/inventory/transfer" className="hover:text-[#006397] transition-colors">Stock Transfer</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Transfer History</span>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-[#162839]" />
            </button>
            <div>
              <h2 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">Transfer Tracking</h2>
              <p className="text-[16px] text-neutral-500 mt-1">Monitor all active and historical stock movements.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setLoading(true);
              fetch('/api/inventory/transfers')
                .then(async res => {
                  if (!res.ok) throw new Error('Failed to fetch');
                  const text = await res.text();
                  return text ? JSON.parse(text) : [];
                })
                .then(data => {
                  setTransfers(data);
                  setLoading(false);
                })
                .catch(err => {
                  console.error(err);
                  setLoading(false);
                });
            }}
            className="p-2.5 bg-white border border-[#edeeef] text-neutral-400 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#edeeef] text-[#162839] font-bold rounded-lg hover:bg-neutral-50 transition-colors text-[14px]"
          >
            <Download className="w-4 h-4" />
            Export Log
          </button>
          <Link 
            to="/inventory/transfer"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#162839] text-white font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm text-[14px]"
          >
            <Plus className="w-4 h-4" />
            New Transfer
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#f3f4f5] border border-[#edeeef] p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#006397] transition-colors" />
          <input 
            type="text" 
            placeholder="Search by transfer ID, source, or destination..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[14px] focus:ring-2 focus:ring-[#5cb8fd]/20 focus:border-[#5cb8fd] outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <button className="w-full justify-center flex items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap">
              <Filter className="w-4 h-4 text-neutral-400" />
              Status: All
            </button>
          </div>
          <button className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap">
            <Calendar className="w-4 h-4 text-neutral-400" />
            May 2026
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="bg-white border border-[#edeeef] p-12 text-center text-neutral-400 rounded-xl">
            Loading transfer logs...
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="bg-white border border-[#edeeef] p-12 text-center text-neutral-400 rounded-xl">
            No transfer records found.
          </div>
        ) : filteredTransfers.map((t) => {
          return (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden hover:border-[#006397] transition-all group"
            >
              <div className="p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Status Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  t.status === 'RECEIVED' ? 'bg-green-50' : 
                  t.status === 'IN TRANSIT' ? 'bg-blue-50' : 'bg-neutral-50'
                }`}>
                  {t.status === 'RECEIVED' ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : 
                   t.status === 'IN TRANSIT' ? <Truck className="w-6 h-6 text-blue-600" /> : 
                   <Clock className="w-6 h-6 text-neutral-400" />}
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
      {isModalOpen && selectedTransfer && (
        <div className="fixed inset-0 bg-[#001d31]/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#edeeef] flex justify-between items-center bg-[#f8f9fa]">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-[20px] font-black text-[#162839]">{selectedTransfer.transfer_number}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedTransfer.status)}`}>
                    {selectedTransfer.status}
                  </span>
                </div>
                <p className="text-[13px] text-neutral-500 font-medium">Created on {new Date(selectedTransfer.created_at).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-neutral-200 rounded-full text-neutral-400 transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Route Info */}
              <div className="flex items-center justify-between p-6 bg-[#f3f4f5] rounded-2xl border border-[#edeeef]">
                <div className="text-center flex-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Source</p>
                  <p className="text-[15px] font-black text-[#162839]">{selectedTransfer.source}</p>
                </div>
                <div className="px-8 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#162839] flex items-center justify-center shadow-lg">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-px h-8 bg-neutral-200" />
                </div>
                <div className="text-center flex-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Destination</p>
                  <p className="text-[15px] font-black text-[#162839]">{selectedTransfer.destination}</p>
                </div>
              </div>

              {/* Logistics Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Transport Method</p>
                  <p className="text-[14px] font-bold text-[#162839] capitalize">{selectedTransfer.transport_type || 'Internal Fleet'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Priority Level</p>
                  <p className={`text-[14px] font-bold uppercase ${selectedTransfer.priority === 'URGENT' ? 'text-red-500' : 'text-[#162839]'}`}>
                    {selectedTransfer.priority}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h4 className="text-[14px] font-black text-[#162839] uppercase tracking-widest border-b border-[#edeeef] pb-2">Transferred Items</h4>
                <div className="divide-y divide-[#edeeef]">
                  {Array.isArray((selectedTransfer as any).items) ? (selectedTransfer as any).items.map((item: any, idx: number) => (
                    <div key={idx} className="py-4 flex justify-between items-center">
                      <div>
                        <p className="text-[14px] font-black text-[#162839]">{item.name}</p>
                        <p className="text-[12px] text-neutral-400 font-mono">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[16px] font-black text-[#006397]">{item.qty} units</p>
                      </div>
                    </div>
                  )) : (
                    <p className="py-4 text-neutral-400 text-center italic">Loading items detail...</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedTransfer.notes && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <History className="w-3 h-3" /> Personnel Notes
                  </p>
                  <p className="text-[13px] text-amber-900 leading-relaxed italic">{selectedTransfer.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#edeeef] bg-[#f8f9fa] flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-[13px] font-bold text-neutral-500 hover:text-[#162839] transition-colors"
              >
                Close Window
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-[#162839] text-white font-bold rounded-lg hover:opacity-90 transition-opacity text-[14px] shadow-lg">
                <Download className="w-4 h-4" /> Download Receipt
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
