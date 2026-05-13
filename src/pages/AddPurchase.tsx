import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  History, 
  Search, 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingCart,
  Package,
  Truck
} from 'lucide-react';
import { useAppContext } from '../store';

export default function AddPurchase() {
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, supRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/suppliers')
        ]);
        
        if (!invRes.ok) throw new Error('Inventory fetch failed');
        if (!supRes.ok) throw new Error('Suppliers fetch failed');
        
        const invData = await invRes.text();
        const supData = await supRes.text();
        
        setInventory(invData ? JSON.parse(invData) : []);
        setSuppliers(supData ? JSON.parse(supData) : []);
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
                      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
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
        cost: product.cost || 0,
        qty: 1
      }]);
    }
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
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === Number(selectedSupplierId));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-[#162839]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[30px] leading-tight font-bold tracking-tight">New Purchase Order</h2>
          <p className="text-[16px] text-neutral-500 mt-1">Restock inventory from suppliers</p>
        </div>
        <div className="flex gap-3">
          <Link to="/purchases" className="flex items-center gap-2 px-5 py-2 bg-[#162839] text-white text-[13px] font-bold rounded-lg hover:opacity-90 transition-opacity">
            <History className="w-4 h-4" />
            Purchase History
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <section className="col-span-12 lg:col-span-7 space-y-6">
         <div className="bg-white border border-[#edeeef] p-5 rounded-xl shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search inventory items..." 
                  className="w-full bg-[#f3f4f5] border-none rounded-lg pl-11 pr-4 py-3.5 text-[14px] focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all"
                />
              </div>
              <button 
                type="button"
                onClick={() => setSearchOnlyRaw(!searchOnlyRaw)}
                className={`px-4 py-3 rounded-lg text-[12px] font-bold tracking-tight transition-all uppercase whitespace-nowrap ${
                  searchOnlyRaw ? 'bg-[#162839] text-white shadow-md' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                }`}
              >
                Raw Materials focus
              </button>
            </div>
            {searchQuery && (
              <div className="max-h-60 overflow-y-auto border rounded-xl divide-y">
                {filteredItems.map(item => (
                  <div key={item.id} onClick={() => handleAddItem(item)} className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-neutral-400">{item.sku} • Current Stock: {item.stock}</p>
                    </div>
                    <Plus className="w-4 h-4 text-[#5cb8fd]"/>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden min-h-[400px]">
             <table className="w-full text-left">
                <thead className="bg-[#f3f4f5] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b">
                   <tr>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4 text-right">Cost Price</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4"></th>
                   </tr>
                </thead>
                <tbody className="divide-y text-[14px]">
                   {selectedItems.map(item => (
                      <tr key={item.product_id} className="hover:bg-neutral-50 transition-colors">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-neutral-100 rounded flex items-center justify-center"><Package className="w-4 h-4 text-neutral-400"/></div>
                               <div>
                                  <p className="font-bold">{item.name}</p>
                                  <p className="text-[10px] text-neutral-400 uppercase tracking-tight">{item.sku}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 font-bold">
                               <span className="text-neutral-400">$</span>
                               <input 
                                 type="number" 
                                 value={item.cost}
                                 onChange={e => handleUpdateCost(item.product_id, Number(e.target.value))}
                                 className="w-20 text-right bg-neutral-100 border-none rounded p-1 outline-none"
                               />
                            </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded">
                               <button onClick={() => handleUpdateQty(item.product_id, -1)} className="hover:text-red-500"><Minus className="w-3 h-3"/></button>
                               <span className="min-w-6 font-bold">{item.qty}</span>
                               <button onClick={() => handleUpdateQty(item.product_id, 1)} className="hover:text-emerald-500"><Plus className="w-3 h-3"/></button>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right font-bold">${(item.cost * item.qty).toFixed(2)}</td>
                         <td className="px-6 py-4 text-right"><button onClick={() => handleRemoveItem(item.product_id)}><Trash2 className="w-4 h-4 text-neutral-300 hover:text-red-500"/></button></td>
                      </tr>
                   ))}
                   {selectedItems.length === 0 && (
                      <tr>
                         <td colSpan={5} className="px-6 py-20 text-center text-neutral-400 italic">No items added to purchase order yet.</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#edeeef] p-6 rounded-xl shadow-sm">
             <h3 className="font-bold mb-4 text-[18px]">Supplier</h3>
             <select 
               value={selectedSupplierId}
               onChange={e => setSelectedSupplierId(e.target.value ? Number(e.target.value) : '')}
               className="w-full bg-[#f3f4f5] border border-[#edeeef] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#5cb8fd] font-medium"
             >
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
             </select>
             {selectedSupplier && (
               <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md"><Truck className="w-6 h-6" /></div>
                  <div><p className="font-bold">{selectedSupplier.name}</p><p className="text-[12px] text-emerald-600 font-medium">{selectedSupplier.company} • {selectedSupplier.category}</p></div>
               </div>
             )}
          </div>
          <div className="bg-[#162839] p-8 rounded-2xl shadow-xl text-white">
             <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Total Estimated Cost</p>
             <p className="text-[42px] font-bold mb-8 tracking-tight">${total.toFixed(2)}</p>
             <button onClick={handleCompletePurchase} className="w-full bg-[#5cb8fd] text-[#00476e] font-black py-4 rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg">
                <ShoppingCart className="w-5 h-5"/>
                CREATE PURCHASE ORDER
             </button>
             <p className="mt-4 text-[11px] text-white/40 text-center font-medium leading-relaxed">By creating this order, inventory stock levels will be updated upon fulfillment and a ledger entry will be recorded.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
