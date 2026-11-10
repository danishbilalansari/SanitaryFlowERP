import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ItemImage } from '../components/ItemImage';
import { 
  History, 
  Search, 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingCart,
  Package,
  Truck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAppContext } from '../store';
import { GlassSelect } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

export default function AddPurchase() {
  const { showToast, currency } = useAppContext();
  const navigate = useNavigate();

  const cachedInv = peekApiCache<any[]>('/api/inventory', 60_000);
  const cachedSup = peekApiCache<any[]>('/api/suppliers', 60_000);
  const [inventory, setInventory] = useState<any[]>(() => Array.isArray(cachedInv) ? cachedInv : []);
  const [suppliers, setSuppliers] = useState<any[]>(() => Array.isArray(cachedSup) ? cachedSup : []);
  const [loading, setLoading] = useState<boolean>(() => !(Array.isArray(cachedInv) && Array.isArray(cachedSup)));
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchBoxRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invData, supData] = await Promise.all([
          cachedJsonFetch('/api/inventory', undefined, 60_000),
          cachedJsonFetch('/api/suppliers', undefined, 60_000)
        ]);
        setInventory(Array.isArray(invData) ? invData : []);
        setSuppliers(Array.isArray(supData) ? supData : []);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [searchOnlyRaw, setSearchOnlyRaw] = useState(true);

  const filteredItems = inventory.filter(item => {
    const queryMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (item.size || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (item.color || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (searchOnlyRaw) {
      const isRaw = (item.category || '').toLowerCase().includes('raw') || 
                    ['powder', 'compound', 'fittings', 'kaolin', 'glaze'].some(token => item.name.toLowerCase().includes(token));
      return queryMatch && isRaw;
    }
    return queryMatch;
  });

  const subtotal = selectedItems.reduce((acc, item) => acc + (item.cost * item.qty), 0);
  const total = subtotal; 

  const handleAddItem = (product: any) => {
    const existing = selectedItems.find(i => i.product_id === product.id);
    if (existing) {
      setSelectedItems(items => items.map(item => 
        item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        size: product.size,
        color: product.color,
        weight: product.weight,
        image: product.image,
        stock: product.stock,
        cost: product.cost || product.price || 0,
        qty: 1
      }]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleUpdateQty = (productId: number, delta: number) => {
    setSelectedItems(items => items.map(item => {
      if (item.product_id === productId) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
  };

  const handleUpdateCost = (productId: number, cost: number) => {
    setSelectedItems(items => items.map(item => {
      if (item.product_id === productId) {
        return { ...item, cost };
      }
      return item;
    }));
  };

  const handleRemoveItem = (productId: number) => {
    setSelectedItems(items => items.filter(item => item.product_id !== productId));
  };

  const handleCompletePurchase = async () => {
    if (!selectedSupplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }
    if (selectedItems.length === 0) {
      showToast('Please add items to the purchase', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: selectedSupplierId,
          items: selectedItems.map(({ product_id, qty, cost }) => ({ product_id, qty, cost }))
        })
      });

      if (response.ok) {
        invalidateApiCache('/api/purchases');
        invalidateApiCache('/api/suppliers');
        invalidateApiCache('/api/inventory');
        invalidateApiCache('/api/ledger');
        showToast('Purchase order created!', 'success');
        navigate('/purchases');
      } else {
        let errorMessage = 'Failed to create purchase';
        try {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      showToast('A network error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === Number(selectedSupplierId));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 text-slate-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/purchases" className="hover:text-[#0284c7] transition-colors">Purchases</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0284c7] font-bold">New Order</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl leading-tight font-extrabold tracking-tight text-slate-900">New Purchase Order</h2>
          <p className="text-sm text-slate-600 mt-0.5">Restock inventory from suppliers</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/purchases" 
            className="flex items-center gap-2 px-5 py-2.5 glass-pill-button text-slate-800 text-[13px] font-semibold rounded-full"
          >
            <History className="w-4 h-4 text-[#0284c7]" />
            <span>Purchase History</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-7 space-y-6">
          {/* Search & Filter Toolbar */}
          <div ref={searchBoxRef} className="glass-search-toolbar relative z-40">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 group">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0284c7] transition-colors pointer-events-none z-10" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onFocus={() => setShowDropdown(true)}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  placeholder="Search inventory items..." 
                  className="w-full rounded-full pl-11 pr-4 py-3 text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
              <button 
                type="button"
                onClick={() => setSearchOnlyRaw(!searchOnlyRaw)}
                className={`px-4 py-3 rounded-full text-[12px] font-bold tracking-wide transition-all uppercase whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
                  searchOnlyRaw 
                    ? 'bg-sky-100/95 border-[1.5px] border-sky-300 text-[#0284c7] shadow-[0_4px_14px_rgba(2,132,199,0.14),inset_0_1px_1px_rgba(255,255,255,1)]' 
                    : 'glass-pill-button text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${searchOnlyRaw ? 'bg-[#0284c7]' : 'bg-slate-300'}`} />
                <span>Raw Materials Focus</span>
              </button>
            </div>

            {showDropdown && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.15)] divide-y divide-slate-100 z-50 p-1.5">
                {filteredItems.length > 0 ? filteredItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => handleAddItem(item)} 
                    className="p-3 hover:bg-sky-50/80 rounded-xl cursor-pointer flex justify-between items-center gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl border border-white flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        <ItemImage src={item.image} name={item.name} className="w-full h-full object-cover text-[10px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-[13.5px]">{item.name}</p>
                        <p className="text-xs text-slate-500 truncate">{item.description || item.product_line || 'No description'}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.sku} • Size: {item.size || '-'} • Color: {item.color || '-'} • Stock: {item.stock ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-sky-100/80 text-[#0284c7] flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                )) : (
                  <div className="p-4 text-center text-slate-400 text-sm">No matching inventory items found</div>
                )}
              </div>
            )}
          </div>

          <div className="glass-table-container relative z-10 min-h-[400px]">
             <table className="w-full text-left">
                <thead>
                   <tr>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4 text-right">Cost Price</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4"></th>
                   </tr>
                </thead>
                <tbody className="text-[13.5px]">
                   {selectedItems.map(item => (
                      <tr key={item.product_id}>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-9 h-9 bg-slate-100 rounded-xl border border-white flex items-center justify-center overflow-hidden shrink-0">
                                  <ItemImage src={item.image} name={item.name} className="w-full h-full object-cover text-[10px]" />
                               </div>
                               <div>
                                  <p className="font-bold text-slate-900">{item.name}</p>
                                  <p className="text-[11px] text-slate-500">{item.description || 'No description'}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-tight">
                                    {item.sku} • Size: {item.size || '-'} • Color: {item.color || '-'} • Stock: {item.stock ?? 0}
                                  </p>
                               </div>
                            </div>
                         </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 font-bold">
                               <span className="text-slate-400">{currency}</span>
                               <input 
                                 type="number" 
                                 min="0.01"
                                 step="0.01"
                                 value={item.cost}
                                 onChange={e => handleUpdateCost(item.product_id, Math.max(0.01, Number(e.target.value)))}
                                 className="w-24 text-right rounded-xl px-2.5 py-1.5 outline-none text-[13px] font-bold"
                               />
                            </div>
                          </td>
                         <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-2 bg-white/90 border border-white px-2.5 py-1 rounded-full shadow-2xs">
                               <button type="button" onClick={() => handleUpdateQty(item.product_id, -1)} className="hover:text-rose-500 p-0.5"><Minus className="w-3.5 h-3.5"/></button>
                               <input
                                 type="number"
                                 min="1"
                                 value={item.qty}
                                 onChange={(e) => {
                                   const val = parseInt(e.target.value, 10);
                                   if (!isNaN(val)) {
                                     setSelectedItems(items => items.map(i => i.product_id === item.product_id ? { ...i, qty: Math.max(1, val) } : i));
                                   }
                                 }}
                                 className="w-14 text-center bg-transparent border-none outline-none font-bold p-0"
                               />
                               <button type="button" onClick={() => handleUpdateQty(item.product_id, 1)} className="hover:text-emerald-600 p-0.5"><Plus className="w-3.5 h-3.5"/></button>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right font-extrabold text-slate-900 tabular-nums">{formatCurrency(item.cost * item.qty, currency)}</td>
                         <td className="px-6 py-4 text-right">
                           <button type="button" onClick={() => handleRemoveItem(item.product_id)} className="w-8 h-8 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50/80 transition-colors">
                             <Trash2 className="w-4 h-4"/>
                           </button>
                         </td>
                      </tr>
                   ))}
                   {selectedItems.length === 0 && (
                      <tr>
                         <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">No items added to purchase order yet.</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-5 space-y-6">
          <div className="glass-card p-6 sm:p-7">
             <h3 className="font-bold mb-3 text-[16px] text-slate-900">Supplier</h3>
             <div className="relative">
               <GlassSelect 
                 value={selectedSupplierId}
                 onChange={e => setSelectedSupplierId(e.target.value ? Number(e.target.value) : '')}
               >
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
               </GlassSelect>
             </div>
             {selectedSupplier && (
               <div className="mt-4 p-4 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-sm"><Truck className="w-5 h-5" /></div>
                  <div>
                    <p className="font-bold text-slate-900">{selectedSupplier.name}</p>
                    <p className="text-xs text-emerald-700 font-semibold">{selectedSupplier.company} • {selectedSupplier.category}</p>
                  </div>
               </div>
             )}
          </div>

          <div className="glass-card p-7 sm:p-8 relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-sky-300/20 blur-2xl pointer-events-none" />
             <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.1em] mb-2">Total Estimated Cost</p>
             <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-7 tracking-tight tabular-nums">{formatCurrency(total, currency)}</p>
             <button 
                type="button"
                onClick={handleCompletePurchase} 
                disabled={saving}
                className="w-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-bold py-4 rounded-full hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(2,132,199,0.28)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-[13.5px] tracking-wide"
             >
                {saving ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <ShoppingCart className="w-4 h-4"/>
                )}
                <span>{saving ? 'Creating Order...' : 'CREATE PURCHASE ORDER'}</span>
             </button>
             <p className="mt-4 text-xs text-slate-400 text-center font-medium leading-relaxed">
               By creating this order, inventory stock levels will be updated upon fulfillment and a ledger entry will be recorded.
             </p>
          </div>
        </section>
      </div>
    </div>
  );
}
