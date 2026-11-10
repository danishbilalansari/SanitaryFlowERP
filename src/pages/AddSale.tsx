import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ItemImage } from '../components/ItemImage';
import { GlassSelect } from '../components/GlassUI';
import { 
  History, 
  Search, 
  Filter, 
  LayoutGrid, 
  ScanLine, 
  Trash2, 
  Minus, 
  Plus, 
  PlusCircle, 
  UserPlus, 
  Edit2, 
  Info, 
  Calculator, 
  CreditCard, 
  Wallet, 
  Receipt,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Package
} from 'lucide-react';
import { useAppContext } from '../store';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

export default function AddSale() {
  const { showToast, currency } = useAppContext();
  const navigate = useNavigate();

  const cachedInv = peekApiCache<any[]>('/api/inventory', 60_000);
  const cachedCust = peekApiCache<any[]>('/api/customers', 60_000);
  const [inventory, setInventory] = useState<any[]>(() => Array.isArray(cachedInv) ? cachedInv : []);
  const [customers, setCustomers] = useState<any[]>(() => Array.isArray(cachedCust) ? cachedCust : []);
  const [loading, setLoading] = useState<boolean>(() => !(Array.isArray(cachedInv) && Array.isArray(cachedCust)));
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      cachedJsonFetch<any[]>('/api/inventory', { credentials: 'include' }, 60_000),
      cachedJsonFetch<any[]>('/api/customers', { credentials: 'include' }, 60_000)
    ])
      .then(([invData, custData]) => {
        setInventory(Array.isArray(invData) ? invData : []);
        setCustomers(Array.isArray(custData) ? custData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  }, []);

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.size || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.color || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subtotal = selectedItems.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 0)), 0);
  const grandTotal = Math.max(0, subtotal - discount);

  const handleAddItem = (product: any) => {
    const existing = selectedItems.find(i => i.product_id === product.id);
    if (existing) {
      if (existing.qty + 1 > product.stock) {
        showToast('Insufficient stock!', 'error');
        return;
      }
      setSelectedItems(items => items.map(item => 
        item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      if (product.stock < 1) {
        showToast('Out of stock!', 'error');
        return;
      }
      setSelectedItems([...selectedItems, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        size: product.size,
        color: product.color,
        image: product.image,
        price: product.price,
        qty: 1,
        max: product.stock
      }]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleUpdateQty = (productId: number, delta: number) => {
    setSelectedItems(items => items.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.qty + delta);
        if (newQty > item.max) {
           showToast('Cannot exceed available stock', 'error');
           return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const handleRemoveItem = (productId: number) => {
    setSelectedItems(items => items.filter(item => item.product_id !== productId));
  };

  const handleCompleteSale = async () => {
    if (!selectedCustomerId) {
      showToast('Please select a customer', 'error');
      return;
    }
    if (selectedItems.length === 0) {
      showToast('Please add items to the sale', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const finalPaid = paymentMethod === 'CASH' ? grandTotal : (Number(paidAmount) || 0);
      const status = paymentMethod === 'CASH' ? 'Completed' : 'Processing';

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          items: selectedItems.map(({ product_id, qty, price }) => ({ product_id, qty, price })),
          discount,
          payment_method: paymentMethod,
          paid_amount: finalPaid,
          status: status
        })
      });

      if (response.ok) {
        invalidateApiCache('/api/sales');
        invalidateApiCache('/api/inventory');
        invalidateApiCache('/api/customers');
        invalidateApiCache('/api/ledger');
        invalidateApiCache('/api/reports/customer-summary-city-wise');
        invalidateApiCache('/api/shop/dashboard');
        showToast('Sale completed successfully!', 'success');
        navigate('/sales');
      } else {
        let errorMessage = 'Failed to complete sale';
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

  const selectedCustomer = customers.find(c => c.id === Number(selectedCustomerId));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/sales" className="hover:text-[#0284c7] transition-colors">Sales</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0284c7] font-bold">New Invoice</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl leading-tight font-extrabold text-slate-900 tracking-tight">New Sale Entry</h2>
          <p className="text-sm text-slate-600 mt-0.5">Create a new invoice and process customer payment</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-5 py-2.5 glass-pill-button text-slate-700 text-[13px] font-semibold rounded-full cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <Link to="/sales" className="flex items-center gap-2 px-5 py-2.5 glass-pill-button text-slate-800 text-[13px] font-semibold rounded-full">
            <History className="w-4 h-4 text-[#0284c7]" />
            <span>Recent Sales</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-7 space-y-6">
          <div 
            className="glass-search-toolbar relative z-40"
            onMouseLeave={() => setShowDropdown(false)}
          >
            <div className="relative w-full group">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0284c7] transition-colors pointer-events-none z-10" />
              <input 
                type="text" 
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                placeholder="Search products by name, SKU, color..." 
                className="w-full rounded-full pl-11 pr-4 py-3 text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              />
              {showDropdown && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.15)] divide-y divide-slate-100 z-50 p-1.5">
                  {filteredItems.length > 0 ? filteredItems.map(item => (
                    <div key={item.id} onClick={() => handleAddItem(item)} className="p-3 hover:bg-sky-50/80 rounded-xl cursor-pointer flex justify-between items-center gap-4 transition-colors">
                      <div className="flex gap-3 min-w-0 items-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-white flex items-center justify-center shrink-0 overflow-hidden">
                          <ItemImage src={item.image} name={item.name} className="w-full h-full object-cover rounded text-[10px]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-[13.5px]">{item.name}</p>
                          <p className="text-xs text-slate-500 truncate">{item.description || item.product_line || 'No description'}</p>
                          <p className="text-[11px] text-slate-400">{item.sku} • Size: {item.size || '-'} • Color: {item.color || '-'} • Stock: {item.stock ?? 0}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-[#0284c7] shrink-0 tabular-nums text-[13.5px]">{formatCurrency(item.price ?? 0, currency)}</span>
                    </div>
                  )) : <div className="p-4 text-center text-slate-400 text-sm">No items found</div>}
                </div>
              )}
            </div>
          </div>

          <div className="glass-table-container relative z-10 min-h-[400px]">
             <table className="w-full text-left">
                <thead>
                   <tr>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4 text-right">Price</th>
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
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-white flex items-center justify-center shrink-0 overflow-hidden">
                                <ItemImage src={item.image} name={item.name} className="w-full h-full object-cover text-[10px]" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <p className="text-[11px] text-slate-500">{item.description || 'No description'}</p>
                                <p className="text-[10px] text-slate-400">{item.sku} • Size: {item.size || '-'} • Color: {item.color || '-'} • Stock: {item.max ?? 0}</p>
                              </div>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right font-bold tabular-nums">{formatCurrency(item.price ?? 0, currency)}</td>
                         <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-2 bg-white/90 border border-white px-2.5 py-1 rounded-full shadow-2xs">
                               <button type="button" onClick={() => handleUpdateQty(item.product_id, -1)} className="hover:text-rose-500 p-0.5"><Minus className="w-3.5 h-3.5"/></button>
                               <input
                                 type="number"
                                 min="1"
                                 max={item.max}
                                 value={item.qty}
                                 onChange={(e) => {
                                   const val = parseInt(e.target.value, 10);
                                   if (!isNaN(val)) {
                                     if (val > item.max) {
                                       showToast(`Cannot exceed available stock (${item.max})`, 'error');
                                       setSelectedItems(items => items.map(i => i.product_id === item.product_id ? { ...i, qty: item.max } : i));
                                     } else {
                                       setSelectedItems(items => items.map(i => i.product_id === item.product_id ? { ...i, qty: Math.max(1, val) } : i));
                                     }
                                   } else {
                                     setSelectedItems(items => items.map(i => i.product_id === item.product_id ? { ...i, qty: '' as any } : i));
                                   }
                                 }}
                                 onBlur={() => {
                                   setSelectedItems(items => items.map(i => {
                                     if (i.product_id === item.product_id) {
                                       if (!i.qty || isNaN(Number(i.qty))) {
                                         return { ...i, qty: 1 };
                                       }
                                     }
                                     return i;
                                   }));
                                 }}
                                 className="w-14 text-center bg-transparent border-none outline-none font-bold p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                               />
                               <button type="button" onClick={() => handleUpdateQty(item.product_id, 1)} className="hover:text-emerald-600 p-0.5"><Plus className="w-3.5 h-3.5"/></button>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right font-extrabold text-slate-900 tabular-nums">{formatCurrency((item.price ?? 0) * (item.qty ?? 0), currency)}</td>
                         <td className="px-6 py-4 text-right">
                           <button type="button" onClick={() => handleRemoveItem(item.product_id)} className="w-8 h-8 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50/80 transition-colors">
                             <Trash2 className="w-4 h-4"/>
                           </button>
                         </td>
                      </tr>
                   ))}
                   {selectedItems.length === 0 && (
                      <tr>
                         <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">No items added to invoice yet.</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-5 space-y-6">
          <div className="glass-card p-6 sm:p-7 space-y-4">
             <div>
               <h3 className="font-bold mb-2 text-[14px] text-slate-700">Customer</h3>
               <GlassSelect 
                 value={selectedCustomerId}
                 onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
               >
                  <option value="">Select Customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </GlassSelect>
             </div>

             <div>
               <h3 className="font-bold mb-2 text-[14px] text-slate-700">Discount ({currency})</h3>
               <input
                 type="number"
                 min="0"
                 step="0.01"
                 value={discount}
                 onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                 className="w-full rounded-2xl px-4 py-3 outline-none font-semibold text-[14px]"
               />
             </div>

             <div>
               <h3 className="font-bold mb-2 text-[14px] text-slate-700">Payment Method</h3>
               <GlassSelect 
                 value={paymentMethod}
                 onChange={e => setPaymentMethod(e.target.value)}
               >
                  <option value="CASH">Cash / Full Payment</option>
                  <option value="CREDIT">Credit (Partial or Zero Payment)</option>
               </GlassSelect>
             </div>

             {paymentMethod === 'CREDIT' && (
               <div>
                 <h3 className="font-bold mb-2 text-[14px] text-slate-700">Paid Amount ({currency})</h3>
                 <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter amount paid upfront"
                    value={paidAmount}
                    onChange={e => {
                       const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                       setPaidAmount(val);
                    }}
                    className="w-full rounded-2xl px-4 py-3 outline-none font-semibold text-[14px]"
                    id="paid-amount-input"
                 />
                 <p className="text-xs text-slate-500 mt-2">Remaining balance will be added to customer's account.</p>
               </div>
             )}
          </div>

          <div className="glass-card p-7 sm:p-8 relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-sky-300/20 blur-2xl pointer-events-none" />
             <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.1em] mb-2">Total Amount</p>
             <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-7 tracking-tight tabular-nums">{formatCurrency(grandTotal, currency)}</p>
             <button 
                type="button"
                onClick={handleCompleteSale} 
                disabled={saving}
                className="w-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-bold py-4 rounded-full hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(2,132,199,0.28)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-[13.5px] tracking-wide"
             >
                {saving ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <ShoppingCart className="w-4 h-4" />
                )}
                <span>{saving ? 'Completing Sale...' : 'COMPLETE SALE'}</span>
             </button>
          </div>
        </section>
      </div>
    </div>
  );
}
