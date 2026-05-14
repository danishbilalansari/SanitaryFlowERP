import React, { useState, useEffect } from 'react';
import { 
  Send, Save, MapPin, ClipboardList, Info, AlertTriangle, 
  Trash2, ArrowRight, Truck, HardHat, Calendar,
  ChevronRight, Map, Route, Filter, Plus, Search, X
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store';

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
      fetch(`/api/inventory?warehouse=${encodeURIComponent(sourceWarehouse)}`)
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
  }, [showProductSelector]);

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
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-1">
        <nav className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
          <span className="cursor-pointer hover:text-[#006397]" onClick={() => navigate('/inventory')}>Inventory</span>
          <span className="text-neutral-300">/</span>
          <span className="text-[#006397]">Stock Transfer</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
          <div>
            <h2 className="text-[30px] leading-tight font-bold text-[#162839] tracking-tight">{isStockOut ? 'Stock Out' : 'New Transfer Request'}</h2>
            <p className="text-[16px] text-neutral-500 mt-1">{isStockOut ? 'Record products leaving the factory for retail outlets or distribution.' : 'Manage inter-warehouse stock movements from factory production lines to retail outlets.'}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-white border border-[#c4c6cd] text-[#162839] text-[14px] font-bold rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? '...' : 'Save as Draft'}
            </button>
            <button 
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#162839] text-white text-[14px] font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-[#f3f4f5] border border-[#edeeef] rounded-xl p-8 shadow-sm">
        <div className="flex justify-between items-center max-w-4xl mx-auto relative">
          <div className="absolute top-[20px] left-[5%] right-[5%] h-[2px] bg-[#e1e3e4]" />
          <div className="absolute top-[20px] left-[5%] w-[28%] h-[2px] bg-[#006397]" />
          
          {steps.map((step, i) => (
            <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step.status === 'active' ? 'bg-[#006397] text-white' : 'bg-[#e1e3e4] text-neutral-500 border border-[#c4c6cd]'
              }`}>
                {step.id}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                step.status === 'active' ? 'text-[#006397]' : 'text-neutral-400'
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
          <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#f3f4f5] px-6 py-4 border-b border-[#edeeef] flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#162839]" />
              <h3 className="text-[18px] font-bold text-[#162839]">Routing Details</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-12 relative">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">SOURCE WAREHOUSE</label>
                <select 
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
                  className="w-full border-[#c4c6cd] rounded-lg text-[14px] py-2.5 focus:ring-2 focus:ring-[#5cb8fd] focus:border-[#5cb8fd] cursor-pointer disabled:bg-neutral-50 disabled:cursor-not-allowed"
                >
                  <option>Main Factory (A-1)</option>
                  <option>Secondary Storage (B-4)</option>
                  <option>Regional Hub (North)</option>
                  <option>Central WH</option>
                  <option>Shop Display</option>
                </select>
                <div className="flex items-center gap-1.5 text-[12px] text-neutral-500 italic mt-1">
                  <Info className="w-3.5 h-3.5" />
                  Currently active for production distributions.
                </div>
              </div>

              {/* Connection Indicator */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full border border-[#edeeef] z-10 shadow-sm">
                <ArrowRight className="w-5 h-5 text-[#006397]" />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">DESTINATION SHOP</label>
                <select 
                  value={destinationShop}
                  onChange={e => {
                    if (e.target.value === sourceWarehouse) {
                      showToast('Source and destination cannot be the same', 'error');
                      return;
                    }
                    setDestinationShop(e.target.value);
                  }}
                  className="w-full border-[#c4c6cd] rounded-lg text-[14px] py-2.5 focus:ring-2 focus:ring-[#5cb8fd] focus:border-[#5cb8fd] cursor-pointer disabled:bg-neutral-50 disabled:cursor-not-allowed"
                >
                  <option>Central WH</option>
                  <option>Secondary Storage (B-4)</option>
                  <option>Regional Hub (North)</option>
                  <option>Shop Display</option>
                  <option>Main Factory (A-1)</option>
                </select>
                <div className="flex items-center gap-1.5 text-[12px] text-red-500 italic mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Real-time stock alerts active for targets.
                </div>
              </div>
            </div>
          </div>

          {/* Item Selection */}
          <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden flex-1 min-h-[400px]">
            <div className="bg-[#f3f4f5] px-6 py-4 border-b border-[#edeeef] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-white rounded">
                   <ClipboardList className="w-4 h-4 text-[#162839]" />
                </div>
                <h3 className="text-[18px] font-bold text-[#162839]">Item Selection</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowProductSelector(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006397] text-white rounded text-[11px] font-bold hover:opacity-90 transition-opacity uppercase tracking-wider shadow-sm"
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
          <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden text-[#162839]">
            <div className="bg-[#162839] px-6 py-4 text-white">
              <h3 className="text-[18px] font-bold">Transfer Summary</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-neutral-500 font-medium">Total Items Selected:</span>
                <span className="font-bold">{items.length} Skus</span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-neutral-500 font-medium">Total Units:</span>
                <span className="font-bold">{items.reduce((acc, item) => acc + item.qty, 0)} units</span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-neutral-500 font-medium">Estimated Weight:</span>
                <span className="font-bold">-</span>
              </div>
              <div className="h-[1px] bg-[#edeeef] my-2" />
              <div className="flex justify-between items-start text-[#162839]">
                <span className="text-[14px] font-bold mt-1">Priority Level:</span>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => setPriority('NORMAL')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                      priority === 'NORMAL' ? 'bg-[#162839] text-white border-transparent' : 'bg-[#f3f4f5] text-neutral-500 border-[#edeeef] hover:bg-neutral-100'
                    }`}
                  >
                    NORMAL
                  </button>
                  <button 
                    onClick={() => setPriority('URGENT')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                      priority === 'URGENT' ? 'bg-red-500 text-white border-transparent shadow-sm' : 'bg-[#f3f4f5] text-neutral-500 border-[#edeeef] hover:bg-neutral-100'
                    }`}
                  >
                    URGENT
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Details */}
          <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden text-[#162839]">
            <div className="bg-[#f3f4f5] px-6 py-4 border-b border-[#edeeef]">
              <h3 className="text-[18px] font-bold text-[#162839]">Logistics Details</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">TRANSPORT MODE</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setTransport('in-house')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      transport === 'in-house' ? 'bg-[#e3f2fd] border-[#006397] text-[#006397]' : 'bg-white border-[#edeeef] text-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                    <span className="text-[11px] font-bold">In-house Truck</span>
                  </button>
                  <button 
                    onClick={() => setTransport('third-party')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      transport === 'third-party' ? 'bg-[#e3f2fd] border-[#006397] text-[#006397]' : 'bg-white border-[#edeeef] text-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    <HardHat className="w-5 h-5" />
                    <span className="text-[11px] font-bold">Third-party Courier</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">EXPECTED ARRIVAL</label>
                <div className="relative">
                   <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                   <input 
                    type="date" 
                    value={expectedArrival}
                    onChange={e => setExpectedArrival(e.target.value)}
                    className="w-full bg-[#f8f9fa] border-2 border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-bold text-[#162839] outline-none focus:ring-2 focus:ring-[#5cb8fd] focus:border-[#5cb8fd] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">INTERNAL NOTES</label>
                <textarea 
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Reason for transfer, handling instructions..."
                  className="w-full bg-[#f8f9fa] border-2 border-[#edeeef] rounded-xl p-4 text-[13px] font-medium text-[#162839] h-32 outline-none focus:ring-2 focus:ring-[#5cb8fd] focus:border-[#5cb8fd] transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button 
                  onClick={() => handleSave(true)}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#f3f4f5] border border-[#edeeef] text-[#162839] font-black rounded-xl hover:bg-neutral-200 transition-all uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </button>
                <button 
                  onClick={() => handleSave(false)}
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#006397] text-white font-black rounded-xl hover:opacity-95 shadow-lg shadow-blue-900/20 transition-all uppercase tracking-widest text-[13px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selector Modal */}
      <AnimatePresence>
        {showProductSelector && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductSelector(false)}
              className="absolute inset-0 bg-[#162839]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-[#edeeef] flex justify-between items-center bg-[#f8f9fa]">
                <h3 className="text-[20px] font-black text-[#162839]">Select Products</h3>
                <button 
                  onClick={() => setShowProductSelector(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="p-6 border-b border-[#edeeef]">
                <div className="relative">
                  <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name or SKU..."
                    className="w-full bg-[#f3f4f5] border-none rounded-xl pl-12 pr-4 py-4 text-[15px] outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {loadingInventory ? (
                  <div className="p-12 text-center text-neutral-400">Loading products...</div>
                ) : filteredInventory.length === 0 ? (
                  <div className="p-12 text-center text-neutral-400">No products found matching "{searchQuery}"</div>
                ) : (
                  <div className="grid gap-2">
                    {filteredInventory.map(product => (
                      <div 
                        key={product.id}
                        onClick={() => addItem(product)}
                        className="flex items-center justify-between p-4 hover:bg-[#f8f9fa] rounded-xl cursor-pointer group transition-colors border border-transparent hover:border-[#edeeef]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[#f3f4f5] border border-[#edeeef] flex items-center justify-center overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Plus className="w-6 h-6 text-neutral-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#162839]">{product.name}</p>
                            <p className="text-[12px] text-neutral-500 font-mono">{product.sku} • {product.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[13px] font-black text-[#162839]">{product.stock} Units</p>
                            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Available</p>
                          </div>
                          <div className="p-2 bg-[#d1e4fb] text-[#162839] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-[#f8f9fa] border-t border-[#edeeef] flex justify-end">
                <button 
                   onClick={() => setShowProductSelector(false)}
                   className="px-8 py-3 bg-[#162839] text-white font-black rounded-xl hover:opacity-90 transition-all text-[13px] uppercase tracking-widest"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
