import React, { useState, useEffect } from 'react';
import { 
  Send, Save, MapPin, ClipboardList, Info, AlertTriangle, 
  Trash2, ArrowRight, Truck, HardHat, Calendar,
  ChevronRight, Map, Route, Filter, Plus, Search, X
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ItemImage } from '../components/ItemImage';
import { GlassSelect, GlassDatePicker, GlassModal } from '../components/GlassUI';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store';
import { cachedJsonFetch, invalidateApiCache } from '../lib/apiCache';

const steps = [
  { id: 1, label: 'DRAFT', status: 'active' },
  { id: 2, label: 'PENDING APPROVAL', status: 'upcoming' },
  { id: 3, label: 'IN TRANSIT', status: 'upcoming' },
  { id: 4, label: 'RECEIVED', status: 'upcoming' },
];

export default function StockTransfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const isStockOut = mode === 'stock-out';

  const { showToast } = useAppContext();
  const [items, setItems] = useState<any[]>([]);
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [transport, setTransport] = useState<'in-house' | 'third-party'>('in-house');
  const [sourceWarehouse, setSourceWarehouse] = useState(isStockOut ? 'Main Factory (A-1)' : 'Main Factory (A-1)');
  const [destinationShop, setDestinationShop] = useState(isStockOut ? 'Shop Display' : 'Central WH');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingInventory, setLoadingInventory] = useState(false);

  useEffect(() => {
    if (showProductSelector) {
      setLoadingInventory(true);
      cachedJsonFetch<any[]>(`/api/inventory?warehouse=${encodeURIComponent(sourceWarehouse)}`, { credentials: 'include' }, 30_000)
        .then(data => {
          setInventory(Array.isArray(data) ? data : []);
          setLoadingInventory(false);
        })
        .catch(() => setLoadingInventory(false));
    }
  }, [showProductSelector, sourceWarehouse]);

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = (product: any) => {
    if (items.find(i => i.id === product.id)) {
      showToast('Item already added', 'info');
      return;
    }
    setItems([...items, {
      id: product.id,
      sku: product.sku,
      name: product.name,
      avail: `${product.stock} Units`,
      qty: 1,
      unit: 'Units'
    }]);
    showToast(`${product.name} added to transfer`, 'success');
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) {
      showToast('Quantity must be at least 1', 'info');
      return;
    }
    const item = items.find(i => i.id === id);
    if (item) {
      const avail = parseInt(item.avail);
      if (qty > avail) {
        showToast(`Only ${avail} units available in ${sourceWarehouse}`, 'error');
        return;
      }
    }
    setItems(items.map(item => item.id === id ? { ...item, qty } : item));
  };

  const handleSave = async (isDraft: boolean) => {
    if (items.length === 0) {
      showToast('Please add at least one product', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory/transfer-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: sourceWarehouse,
          destination: destinationShop,
          items: items.map(i => ({ id: i.id, qty: i.qty })),
          priority,
          transport,
          expectedArrival,
          notes: internalNotes,
          status: isDraft ? 'DRAFT' : 'PENDING APPROVAL'
        })
      });

      if (res.ok) {
        invalidateApiCache('/api/inventory/transfers');
        invalidateApiCache('/api/inventory');
        invalidateApiCache('/api/shop/dashboard');
        showToast(isDraft ? 'Draft saved successfully' : 'Transfer request submitted', 'success');
        navigate('/inventory/transfer/history');
      } else {
        let errorMessage = 'Failed to save transfer';
        try {
          const err = await res.json();
          errorMessage = err.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text or default
          errorMessage = res.statusText || errorMessage;
        }
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.size || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.color || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <span className="cursor-pointer hover:text-[#0284c7] transition-colors" onClick={() => navigate('/inventory')}>Inventory</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0284c7] font-bold">Stock Transfer</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl leading-tight font-extrabold text-slate-900 tracking-tight">{isStockOut ? 'Stock Out' : 'New Transfer Request'}</h2>
          <p className="text-sm text-slate-600 mt-0.5">{isStockOut ? 'Record products leaving the factory for retail outlets or distribution.' : 'Manage inter-warehouse stock movements from factory production lines to retail outlets.'}</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            className="px-5 py-2.5 glass-pill-button text-slate-700 text-[13px] font-semibold rounded-full disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? '...' : 'Save as Draft'}
          </button>
          <button 
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0284c7] to-sky-500 text-white text-[13px] font-semibold rounded-full hover:brightness-105 transition-all shadow-[0_4px_16px_rgba(2,132,199,0.3)] disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
          </button>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex justify-between items-center max-w-4xl mx-auto relative">
          <div className="absolute top-[20px] left-[5%] right-[5%] h-[2px] bg-slate-200/80" />
          <div className="absolute top-[20px] left-[5%] w-[28%] h-[2px] bg-gradient-to-r from-[#0284c7] to-sky-400" />
          
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step.status === 'active' ? 'bg-gradient-to-r from-[#0284c7] to-sky-500 text-white shadow-[0_4px_12px_rgba(2,132,199,0.3)]' : 'bg-white/90 text-slate-400 border border-white shadow-2xs'
              }`}>
                {step.id}
              </div>
              <span className={`text-[10.5px] font-bold uppercase tracking-wider ${
                step.status === 'active' ? 'text-[#0284c7]' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 text-[#191c1d]">
        {/* Main Form Area */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          {/* Routing Details */}
          <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Routing Details</h3>
                <p className="text-[13px] text-slate-500 font-medium">Select source facility and target destination warehouse.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-center">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">SOURCE WAREHOUSE</label>
                <GlassSelect 
                  value={sourceWarehouse}
                  onChange={e => {
                    const newSource = e.target.value;
                    if (newSource === destinationShop) {
                      showToast('Source and destination cannot be the same', 'error');
                      return;
                    }
                    setSourceWarehouse(newSource);
                    setItems([]); // Clear selected items as availability might change
                    if (showProductSelector) {
                       setLoadingInventory(true);
                       fetch(`/api/inventory?warehouse=${encodeURIComponent(newSource)}`)
                        .then(async res => {
                          if (!res.ok) throw new Error('Failed to fetch');
                          const text = await res.text();
                          return text ? JSON.parse(text) : [];
                        })
                        .then(data => {
                          setInventory(data);
                          setLoadingInventory(false);
                        })
                        .catch(() => setLoadingInventory(false));
                    }
                  }}
                >
                  <option>Main Factory (A-1)</option>
                  <option>Secondary Storage (B-4)</option>
                  <option>Regional Hub (North)</option>
                  <option>Central WH</option>
                  <option>Shop Display</option>
                </GlassSelect>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium italic mt-1">
                  <Info className="w-3.5 h-3.5 text-sky-500" />
                  Currently active for production distributions.
                </div>
              </div>

              {/* Connection Indicator */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border border-white z-10 shadow-[0_4px_12px_rgba(15,23,42,0.06)] items-center justify-center text-[#0284c7]">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">DESTINATION SHOP</label>
                <GlassSelect 
                  value={destinationShop}
                  onChange={e => {
                    if (e.target.value === sourceWarehouse) {
                      showToast('Source and destination cannot be the same', 'error');
                      return;
                    }
                    setDestinationShop(e.target.value);
                  }}
                >
                  <option>Central WH</option>
                  <option>Secondary Storage (B-4)</option>
                  <option>Regional Hub (North)</option>
                  <option>Shop Display</option>
                  <option>Main Factory (A-1)</option>
                </GlassSelect>
                <div className="flex items-center gap-1.5 text-[12px] text-amber-600 font-medium italic mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Real-time stock alerts active for targets.
                </div>
              </div>
            </div>
          </div>

          {/* Item Selection */}
          <div className="glass-table-container rounded-[30px] overflow-hidden flex-1 min-h-[400px]">
            <div className="p-6 sm:p-7 border-b border-slate-200/60 bg-white/40 flex justify-between items-center">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                   <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Item Selection</h3>
                  <p className="text-[13px] text-slate-500 font-medium">SKUs and quantities selected for transit</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowProductSelector(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white text-[13px] font-semibold hover:brightness-105 transition-all shadow-[0_4px_14px_rgba(2,132,199,0.28)] cursor-pointer"
                >
                  Add Product
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f3f4f5] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                    <th className="px-6 py-4">SKU / Item Name</th>
                    <th className="px-6 py-4">Availability</th>
                    <th className="px-6 py-4">Transfer Qty</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[14px] divide-y divide-[#edeeef]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                        No items selected for transfer. Click "Add Product" to begin.
                      </td>
                    </tr>
                  ) : items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-[#162839] leading-tight">{item.sku}</p>
                          <p className="text-[12px] text-neutral-500 mt-0.5">{item.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-0.5 bg-[#dcfce7] text-[#166534] text-[11px] font-bold rounded-full">
                          {item.avail}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <input 
                          type="number" 
                          value={item.qty} 
                          onChange={(e) => updateQty(item.id, Number(e.target.value))}
                          className="w-20 border-[#c4c6cd] rounded p-1.5 text-center text-[#162839] font-medium focus:ring-2 focus:ring-[#5cb8fd] outline-none"
                        />
                      </td>
                      <td className="px-6 py-5 text-neutral-500 font-medium">{item.unit}</td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          {/* Summary Card */}
          <div className="glass-card overflow-hidden text-slate-900">
            <div className="bg-white/60 border-b border-white px-6 py-4">
              <h3 className="text-[17px] font-bold text-slate-900">Transfer Summary</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-slate-500 font-medium">Total Items Selected:</span>
                <span className="font-bold text-slate-900">{items.length} Skus</span>
              </div>
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-slate-500 font-medium">Total Units:</span>
                <span className="font-bold text-slate-900">{items.reduce((acc, item) => acc + item.qty, 0)} units</span>
              </div>
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-slate-500 font-medium">Estimated Weight:</span>
                <span className="font-bold text-slate-900">-</span>
              </div>
              <div className="h-[1px] bg-slate-200/60 my-2" />
              <div className="flex justify-between items-center text-slate-900">
                <span className="text-[13.5px] font-bold">Priority Level:</span>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setPriority('NORMAL')}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      priority === 'NORMAL'
                        ? 'bg-sky-100/95 border-[1.5px] border-sky-300 text-[#0284c7] shadow-[0_2px_10px_rgba(2,132,199,0.12)]'
                        : 'glass-pill-button text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Normal
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPriority('URGENT')}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      priority === 'URGENT'
                        ? 'bg-rose-100/95 border-[1.5px] border-rose-300 text-rose-600 shadow-[0_2px_10px_rgba(244,63,94,0.14)]'
                        : 'glass-pill-button text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Urgent
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Details */}
          <div className="glass-card overflow-hidden text-slate-900">
            <div className="bg-white/60 px-6 py-4 border-b border-white">
              <h3 className="text-[17px] font-bold text-slate-900">Logistics Details</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">TRANSPORT MODE</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setTransport('in-house')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer ${
                      transport === 'in-house'
                        ? 'bg-sky-100/85 border-[1.5px] border-sky-300 text-[#0284c7] shadow-[0_6px_18px_rgba(2,132,199,0.12),inset_0_1px_1px_rgba(255,255,255,1)]'
                        : 'bg-white/85 border-[1.5px] border-white text-slate-500 hover:bg-white hover:text-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.04)]'
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                    <span className="text-[12px] font-semibold">In-house Truck</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTransport('third-party')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer ${
                      transport === 'third-party'
                        ? 'bg-sky-100/85 border-[1.5px] border-sky-300 text-[#0284c7] shadow-[0_6px_18px_rgba(2,132,199,0.12),inset_0_1px_1px_rgba(255,255,255,1)]'
                        : 'bg-white/85 border-[1.5px] border-white text-slate-500 hover:bg-white hover:text-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.04)]'
                    }`}
                  >
                    <HardHat className="w-5 h-5" />
                    <span className="text-[12px] font-semibold">Third-party Courier</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">EXPECTED ARRIVAL</label>
                <GlassDatePicker
                  value={expectedArrival}
                  onChange={e => setExpectedArrival(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">INTERNAL NOTES</label>
                <textarea 
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Reason for transfer, handling instructions..."
                  className="w-full rounded-2xl p-4 text-[13.5px] font-medium text-slate-900 h-32 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={isSubmitting}
                  className="w-full py-3.5 glass-pill-button text-slate-800 font-semibold rounded-full text-[13.5px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#0284c7]" />
                  <span>Save as Draft</span>
                </button>
                <button 
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold hover:brightness-105 shadow-[0_6px_20px_rgba(2,132,199,0.28)] transition-all text-[13.5px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Processing...' : 'Submit Request'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selector Modal */}
      {/* Product Selector Modal (renders in Portal at z-[99999] so sidebar is blurred behind) */}
      <GlassModal
        isOpen={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        maxWidth="max-w-2xl"
        className="max-h-[82vh]"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/60">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
            <span className="text-[13px] font-semibold text-slate-800">Select Products</span>
          </div>
          <button 
            onClick={() => setShowProductSelector(false)}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full rounded-2xl bg-white/90 border border-white pl-11 pr-4 py-3.5 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loadingInventory ? (
            <div className="p-12 text-center text-slate-400">Loading products...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No products found matching "{searchQuery}"</div>
          ) : (
            <div className="grid gap-2">
              {filteredInventory.map(product => (
                <div 
                  key={product.id}
                  onClick={() => addItem(product)}
                  className="flex items-center justify-between p-3.5 bg-white/85 hover:bg-white rounded-2xl cursor-pointer group transition-all border border-white shadow-2xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-100/80 border border-white flex items-center justify-center overflow-hidden">
                      <ItemImage src={product.image} name={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-[14px]">{product.name}</p>
                      <p className="text-[12px] text-slate-500">{product.description || product.product_line || 'No description'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{product.sku} • {product.category} • Stock: {product.stock ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-slate-900">{product.stock} Units</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-sky-100/80 text-[#0284c7] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 mt-3 border-t border-slate-200/60 flex justify-end">
          <button 
             onClick={() => setShowProductSelector(false)}
             className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <span className="text-[#0284c7] font-bold">✓</span>
            <span>Done</span>
          </button>
        </div>
      </GlassModal>
    </div>
  );
}
