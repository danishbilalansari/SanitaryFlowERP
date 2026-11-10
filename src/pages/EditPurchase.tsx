import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronRight, 
  Truck, 
  Calendar, 
  PlusCircle, 
  Trash2, 
  Info, 
  RotateCcw, 
  CheckCircle,
  Key,
  History,
  User,
  Trash
} from 'lucide-react';
import { useAppContext } from '../store';
import { GlassSelect, GlassDatePicker, DashboardSkeleton } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

export default function EditPurchase() {
  const { id } = useParams();
  const { showToast, currency } = useAppContext();
  const navigate = useNavigate();

  const cachedOrder = id ? peekApiCache<any>(`/api/purchases/${id}`, 60_000) : undefined;
  const cachedInv = peekApiCache<any[]>('/api/inventory', 60_000);
  const cachedSup = peekApiCache<any[]>('/api/suppliers', 60_000);

  const [order, setOrder] = useState<any>(() => cachedOrder ?? null);
  const [items, setItems] = useState<any[]>(() => Array.isArray(cachedOrder?.items) ? cachedOrder.items : []);
  const [inventory, setInventory] = useState<any[]>(() => Array.isArray(cachedInv) ? cachedInv : []);
  const [suppliers, setSuppliers] = useState<any[]>(() => Array.isArray(cachedSup) ? cachedSup : []);
  const [showItemSelect, setShowItemSelect] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrderData = (forceRefresh = false) => {
    if (!id) return;
    if (forceRefresh) {
      invalidateApiCache(`/api/purchases/${id}`);
    }
    cachedJsonFetch<any>(`/api/purchases/${id}`, { credentials: 'include' }, 60_000)
      .then(data => {
        if (data && !data.error) {
          setOrder(data);
          setItems(data.items || []);
        } else if (data?.error) {
          showToast(data.error, 'error');
        }
      })
      .catch(err => console.error('Error fetching order', err));
  };

  useEffect(() => {
    fetchOrderData();
    cachedJsonFetch('/api/inventory', undefined, 60_000)
      .then(data => setInventory(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching inventory', err));
      
    cachedJsonFetch('/api/suppliers', undefined, 60_000)
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching suppliers', err));
  }, [id]);

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const product = inventory.find(i => String(i.id) === selectedProduct);
    if (!product) return;

    // Check if already in items
    if (items.some(i => i.product_id === product.id)) {
      showToast('Item already in the order', 'info');
      return;
    }

    setItems([...items, {
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      qty: 1,
      cost: product.cost_price || product.price || 0
    }]);
    setShowItemSelect(false);
    setSelectedProduct('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.cost || item.price) || 0)), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          status: order.status,
          supplier_id: order.supplier_id,
          items
        })
      });

      if (response.ok) {
        invalidateApiCache('/api/purchases');
        invalidateApiCache('/api/suppliers');
        invalidateApiCache('/api/inventory');
        invalidateApiCache('/api/ledger');
        showToast('Purchase order updated successfully', 'success');
        navigate('/purchases');
      } else {
        showToast('Failed to update purchase order', 'error');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('An error occurred', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          status: 'Cancelled'
        })
      });

      if (response.ok) {
        invalidateApiCache('/api/purchases');
        invalidateApiCache('/api/suppliers');
        invalidateApiCache('/api/inventory');
        invalidateApiCache('/api/ledger');
        showToast('Purchase order cancelled successfully', 'success');
        navigate('/purchases');
      } else {
        showToast('Failed to cancel purchase order', 'error');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      showToast('An error occurred', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (!order) return <DashboardSkeleton />;
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Breadcrumbs & Status Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/purchases" className="hover:text-[#006397] transition-colors">Purchases</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-neutral-500">{id || 'PO-2023-0892'}</span>
          </nav>
          <h1 className="text-[32px] font-bold text-[#162839] tracking-tight leading-none">Edit Purchase Order</h1>
        </div>
        <div>
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest border shadow-sm ${order?.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-[#cce5ff] text-[#001d31] border-[#5cb8fd]/30'}`}>
            <div className={`p-0.5 rounded-full ${order?.status === 'CANCELLED' ? 'bg-red-600' : 'bg-[#006397]'}`}>
              <Info className="w-2.5 h-2.5 text-white fill-current" />
            </div>
            {order?.status || 'DRAFT'} STATUS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Supplier & Terms */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Supplier Card */}
          <section className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Supplier Information</h3>
                <p className="text-[13px] text-slate-500 font-medium">Selected vendor and primary contact</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Supplier Name</label>
                <div className="relative">
                  <GlassSelect 
                    value={order.supplier_id || ''}
                    disabled={updating || cancelling}
                    onChange={(e) => setOrder({...order, supplier_id: e.target.value})}
                  >
                    <option value="">Select a supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </GlassSelect>
                </div>
              </div>

              {(() => {
                const selectedSup = suppliers.find(s => String(s.id) === String(order.supplier_id));
                return (
                  <>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Contact Person</label>
                      <input 
                        type="text" 
                        readOnly
                        value={selectedSup?.contact_person || 'N/A'}
                        className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                      />
                    </div>

                    <div className="pt-2">
                      <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                        <span className="font-bold text-slate-900">Address:</span> {selectedSup?.address || 'N/A'}<br />
                        {selectedSup?.city || ''}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>

          {/* Logistics Card */}
          <section className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-emerald-600 flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Logistics & Dates</h3>
                <p className="text-[13px] text-slate-500 font-medium">Delivery schedule and shipping tier</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Expected Delivery</label>
                <GlassDatePicker
                  disabled={updating || cancelling}
                  defaultValue="2023-11-24"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Shipping Method</label>
                <div className="relative">
                  <GlassSelect 
                    disabled={updating || cancelling}
                    defaultValue="Expedited Ground (2-3 days)" 
                  >
                    <option>Standard Freight (5-7 days)</option>
                    <option>Expedited Ground (2-3 days)</option>
                    <option>Next Day Air</option>
                  </GlassSelect>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Order Items */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <section className="glass-table-container rounded-[30px] overflow-hidden flex flex-col h-full">
            <div className="p-7 sm:p-8 border-b border-slate-200/60 flex justify-between items-center bg-white/40">
              <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Order Items</h3>
              {!showItemSelect ? (
                <button 
                  onClick={() => setShowItemSelect(true)}
                  disabled={updating || cancelling}
                  className="glass-pill-button flex items-center gap-2 px-5 py-2.5 rounded-full text-[#0284c7] font-semibold text-[13.5px] hover:bg-white/95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add New Item
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="min-w-[230px]">
                    <GlassSelect 
                      value={selectedProduct} 
                      onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                      <option value="">Select a product...</option>
                      {inventory.map(inv => (
                        <option key={inv.id} value={String(inv.id)}>{inv.name} ({inv.sku})</option>
                      ))}
                    </GlassSelect>
                  </div>
                  <button 
                    onClick={handleAddItem}
                    className="px-5 py-2 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white text-[13px] font-semibold shadow-[0_4px_14px_rgba(2,132,199,0.24)] hover:opacity-95 transition-all cursor-pointer"
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => { setShowItemSelect(false); setSelectedProduct(''); }}
                    className="glass-pill-button px-5 py-2 rounded-full text-slate-600 text-[13px] font-semibold hover:bg-white/95 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200/60">
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Item Description</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-32">Quantity</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-40">Unit Price</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                    <th className="px-8 py-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {items.map((item, itemIndex) => (
                    <tr key={`item-${item.id || 'new'}-${item.product_id || '0'}-${itemIndex}`} className="group hover:bg-white/80 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-[14.5px] font-bold text-slate-900">{item.name}</p>
                        <p className="text-[12px] text-slate-400 mt-0.5">SKU: {item.sku}</p>
                      </td>
                      <td className="px-8 py-5">
                        <input 
                          type="number" 
                          value={item.qty}
                          disabled={updating || cancelling}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[itemIndex].qty = parseInt(e.target.value) || 0;
                            setItems(newItems);
                          }}
                          className="w-24 rounded-xl px-3 py-2 text-[14px] font-bold outline-none disabled:opacity-50"
                        />
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold text-xs">{currency}</span>
                          <input 
                            type="number" 
                            step="0.01"
                            disabled={updating || cancelling}
                            value={item.cost || item.price}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[itemIndex].cost = parseFloat(e.target.value) || 0;
                              setItems(newItems);
                            }}
                            className="w-28 rounded-xl px-3 py-2 text-[14px] font-bold outline-none disabled:opacity-50"
                          />
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-900 text-[14.5px]">
                        {formatCurrency(((+item.qty) * (+item.cost || +item.price || 0)), currency)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => handleRemoveItem(itemIndex)}
                          disabled={updating || cancelling}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-white/40 border-t border-slate-200/60 flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-[13.5px] text-slate-500">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-[13.5px] text-slate-500 pb-3 border-b border-slate-200/60">
                  <span className="font-medium">Tax (8%):</span>
                  <span className="font-bold text-slate-800">{formatCurrency(tax, currency)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[18px] font-bold text-slate-900">Total:</span>
                  <span className="text-[22px] font-extrabold text-[#0284c7] tracking-tight">
                    {formatCurrency(total, currency)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Remarks Card */}
          <section className="glass-card p-7 sm:p-8 rounded-[30px] space-y-4">
            <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Special Instructions & Remarks</h3>
            <textarea 
              disabled={updating || cancelling}
              className="w-full rounded-2xl p-4 text-[14px] font-medium text-slate-700 outline-none transition-all leading-relaxed disabled:opacity-50"
              rows={4}
              defaultValue="Please ensure the porcelain tiles are from the same batch (Batch 22A) to avoid color variance. The warehouse will be closed on Friday afternoon."
              placeholder="Add any notes for the supplier or internal team..."
            />
          </section>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#edeeef] pt-10">
        <button 
          onClick={handleCancel}
          disabled={updating || cancelling}
          className="glass-pill-button flex items-center gap-2 text-rose-600 font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-rose-50/80 transition-all disabled:opacity-50 cursor-pointer"
        >
          {cancelling ? (
             <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
          ) : (
             <Trash className="w-4 h-4" />
          )}
          {cancelling ? 'Cancelling...' : 'Cancel Purchase Order'}
        </button>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={fetchOrderData}
            disabled={updating || cancelling}
            className="flex-1 md:flex-none glass-pill-button px-7 py-3 text-slate-700 font-semibold text-[14px] rounded-full hover:bg-white/95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Revert Changes
          </button>
          <button 
            onClick={handleUpdate}
            disabled={updating || cancelling}
            className="flex-1 md:flex-none px-8 py-3 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 hover:from-[#0369a1] hover:to-sky-600 text-white font-semibold text-[14px] transition-all shadow-[0_6px_20px_rgba(2,132,199,0.28)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {updating ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <CheckCircle className="w-4 h-4" />
            )}
            {updating ? 'Updating Order...' : 'Update Order'}
          </button>
        </div>
      </div>

      {/* Audit Trail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-60 pt-8">
        {[
          { icon: User, label: 'Created By', value: 'Admin' }, // Assuming default for now
          { icon: History, label: 'Last Modified', value: order.updated_at ? new Date(order.updated_at).toLocaleString() : 'N/A' },
          { icon: Key, label: 'PO Reference', value: order.po_number },
        ].map((info, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)] shrink-0">
              <info.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.16em]">{info.label}</p>
              <p className="text-[14px] font-bold text-slate-900">{info.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
