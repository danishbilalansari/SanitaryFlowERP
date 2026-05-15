import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function AddSale() {
  const { showToast, currency } = useAppContext();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, custRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/customers')
        ]);
        
        if (!invRes.ok) throw new Error('Inventory fetch failed');
        if (!custRes.ok) throw new Error('Customers fetch failed');
        
        const invData = await invRes.text();
        const custData = await custRes.text();
        
        setInventory(invData ? JSON.parse(invData) : []);
        setCustomers(custData ? JSON.parse(custData) : []);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
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
    }
  };

  const selectedCustomer = customers.find(c => c.id === Number(selectedCustomerId));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[30px] leading-tight font-bold text-[#162839] tracking-tight">New Sale Entry</h2>
          <p className="text-[16px] text-neutral-500 mt-1">Create a new invoice and process customer payment</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-5 py-2 bg-white border border-[#edeeef] text-neutral-600 text-[13px] font-bold rounded-lg hover:bg-neutral-50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <Link to="/sales" className="flex items-center gap-2 px-5 py-2 bg-[#162839] text-white text-[13px] font-bold rounded-lg hover:opacity-90 transition-opacity">
            <History className="w-4 h-4" />
            Recent Sales
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <section className="col-span-12 lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#edeeef] p-5 rounded-xl shadow-sm space-y-5">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                placeholder="Product Search..." 
                className="w-full bg-[#f3f4f5] rounded-lg pl-11 pr-4 py-3.5 text-[14px] outline-none transition-all"
              />
              {showDropdown && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto border bg-white shadow-lg rounded-xl divide-y z-20">
                  {filteredItems.length > 0 ? filteredItems.map(item => (
                    <div key={item.id} onClick={() => handleAddItem(item)} className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between">
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-neutral-400">{item.sku} • {item.stock} in stock</p>
                      </div>
                      <span className="font-bold">{formatCurrency(item.price ?? 0, currency)}</span>
                    </div>
                  )) : <div className="p-3 text-neutral-400 text-sm">No items found</div>}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden min-h-[400px]">
             <table className="w-full text-left">
                <thead className="bg-[#f3f4f5] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b">
                   <tr>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4 text-right">Price</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4"></th>
                   </tr>
                </thead>
                <tbody className="divide-y text-[14px]">
                   {selectedItems.map(item => (
                      <tr key={item.product_id} className="hover:bg-neutral-50">
                         <td className="px-6 py-4">
                            <p className="font-bold">{item.name}</p>
                            <p className="text-[10px] text-neutral-400">{item.sku}</p>
                         </td>
                         <td className="px-6 py-4 text-right font-bold">{formatCurrency(item.price ?? 0, currency)}</td>
                         <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded">
                               <button onClick={() => handleUpdateQty(item.product_id, -1)}><Minus className="w-3 h-3"/></button>
                               <span className="min-w-6 font-bold">{item.qty}</span>
                               <button onClick={() => handleUpdateQty(item.product_id, 1)}><Plus className="w-3 h-3"/></button>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right font-bold">{formatCurrency((item.price ?? 0) * (item.qty ?? 0), currency)}</td>
                         <td className="px-6 py-4 text-right"><button onClick={() => handleRemoveItem(item.product_id)}><Trash2 className="w-4 h-4 text-neutral-300 hover:text-red-500"/></button></td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#edeeef] p-6 rounded-xl shadow-sm">
             <h3 className="font-bold mb-4">Customer</h3>
             <select 
               value={selectedCustomerId}
               onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
               className="w-full bg-[#f3f4f5] rounded-lg px-4 py-3 outline-none"
             >
                <option value="">Select...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>

              <h3 className="font-bold mt-4">Discount ({currency})</h3>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-[#f3f4f5] rounded-lg px-4 py-3 outline-none"
              />

             <h3 className="font-bold mt-4 mb-2">Payment Method</h3>
             <select 
               value={paymentMethod}
               onChange={e => {
                  setPaymentMethod(e.target.value);
                  if (e.target.value === 'CREDIT') {
                     // Default to 0 paid for credit, or keep tracking
                  }
               }}
               className="w-full bg-[#f3f4f5] rounded-lg px-4 py-3 outline-none mb-4"
             >
                <option value="CASH">Cash / Full Payment</option>
                <option value="CREDIT">Credit (Partial or Zero Payment)</option>
             </select>

              {paymentMethod === 'CREDIT' && (
                <div className="mb-4">
                  <h3 className="font-bold mb-2">Paid Amount ({currency})</h3>
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
                     className="w-full bg-[#f3f4f5] rounded-lg px-4 py-3 outline-none"
                     id="paid-amount-input"
                  />
                  <p className="text-xs text-neutral-500 mt-2">Remaining balance will be added to customer's account.</p>
                </div>
              )}
          </div>
          <div className="bg-[#162839] p-8 rounded-2xl shadow-xl text-white">
             <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Total Amount</p>
             <p className="text-[42px] font-bold mb-8">{formatCurrency(grandTotal, currency)}</p>
             <button onClick={handleCompleteSale} className="w-full bg-[#5cb8fd] text-[#00476e] font-black py-4 rounded-xl hover:brightness-110 active:scale-95 transition-all">
                COMPLETE SALE
             </button>
          </div>
        </section>
      </div>
    </div>
  );
}
