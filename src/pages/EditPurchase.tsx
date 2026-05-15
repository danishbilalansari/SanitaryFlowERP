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

export default function EditPurchase() {
  const { id } = useParams();
  const { showToast, currency } = useAppContext();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showItemSelect, setShowItemSelect] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const fetchOrderData = () => {
    fetch(`/api/purchases/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setOrder(data);
          setItems(data.items || []);
        } else {
          showToast(data.error);
        }
      })
      .catch(err => console.error('Error fetching order', err));
  };

  useEffect(() => {
    fetchOrderData();
    // Load inventory for adding new items
    fetch('/api/inventory', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setInventory(data))
      .catch(err => console.error('Error fetching inventory', err));
      
    // Load suppliers
    fetch('/api/suppliers', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setSuppliers(data))
      .catch(err => console.error('Error fetching suppliers', err));
  }, [id]);

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const product = inventory.find(i => String(i.id) === selectedProduct);
    if (!product) return;

    // Check if already in items
    if (items.some(i => i.product_id === product.id)) {
      showToast('Item already in the order');
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
        showToast('Purchase order updated successfully');
        navigate('/purchases');
      } else {
        showToast('Failed to update purchase order');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('An error occurred');
    }
  };

  const handleCancel = async () => {
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
        showToast('Purchase order cancelled successfully');
        navigate('/purchases');
      } else {
        showToast('Failed to cancel purchase order');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      showToast('An error occurred');
    }
  };

  if (!order) return <div>Loading...</div>;
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
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <h3 className="text-[18px] font-bold text-[#162839] mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#d3e4fe] text-[#006397] rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              Supplier Information
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Supplier Name</label>
                <div className="relative">
                  <select 
                    value={order.supplier_id || ''}
                    onChange={(e) => setOrder({...order, supplier_id: e.target.value})}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none appearance-none focus:ring-2 focus:ring-[#5cb8fd] transition-all">
                    <option value="">Select a supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronRight className="w-4 h-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                </div>
              </div>

              {(() => {
                const selectedSup = suppliers.find(s => String(s.id) === String(order.supplier_id));
                return (
                  <>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#162839] block">Contact Person</label>
                      <input 
                        type="text" 
                        readOnly
                        value={selectedSup?.contact_person || 'N/A'}
                        className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                      />
                    </div>

                    <div className="pt-2">
                      <p className="text-[13px] text-neutral-500 leading-relaxed">
                        <span className="font-bold text-[#162839]">Address:</span> {selectedSup?.address || 'N/A'}<br />
                        {selectedSup?.city || ''}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>

          {/* Logistics Card */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <h3 className="text-[18px] font-bold text-[#162839] mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#d3e4fe] text-[#006397] rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              Logistics & Dates
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Expected Delivery</label>
                <input 
                  type="date" 
                  defaultValue="2023-11-24"
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Shipping Method</label>
                <div className="relative">
                  <select defaultValue="Expedited Ground (2-3 days)" className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-bold outline-none appearance-none focus:ring-2 focus:ring-[#5cb8fd] transition-all">
                    <option>Standard Freight (5-7 days)</option>
                    <option>Expedited Ground (2-3 days)</option>
                    <option>Next Day Air</option>
                  </select>
                  <ChevronRight className="w-4 h-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Order Items */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <section className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-[#edeeef] flex justify-between items-center bg-white">
              <h3 className="text-[20px] font-bold text-[#162839]">Order Items</h3>
              {!showItemSelect ? (
                <button 
                  onClick={() => setShowItemSelect(true)}
                  className="flex items-center gap-2 text-[#006397] font-bold text-[14px] hover:underline"
                >
                  <PlusCircle className="w-5 h-5" />
                  Add New Item
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select 
                    value={selectedProduct} 
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="bg-[#f8f9fa] border border-[#edeeef] rounded-lg px-3 py-2 text-[14px] font-medium outline-none"
                  >
                    <option value="">Select a product...</option>
                    {inventory.map(inv => (
                      <option key={inv.id} value={String(inv.id)}>{inv.name} ({inv.sku})</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-[#006397] text-white rounded-lg text-[13px] font-bold hover:bg-[#004e7a]"
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => { setShowItemSelect(false); setSelectedProduct(''); }}
                    className="px-4 py-2 bg-neutral-200 text-neutral-600 rounded-lg text-[13px] font-bold hover:bg-neutral-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f8f9fa] border-b border-[#edeeef]">
                  <tr>
                    <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest">Item Description</th>
                    <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest w-32">Quantity</th>
                    <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest w-40">Unit Price</th>
                    <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest text-right">Total</th>
                    <th className="px-8 py-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edeeef]">
                  {items.map((item, itemIndex) => (
                    <tr key={`item-${item.id || 'new'}-${item.product_id || '0'}-${itemIndex}`} className="group hover:bg-[#f8f9fa]/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-[15px] font-bold text-[#162839]">{item.name}</p>
                        <p className="text-[12px] text-neutral-500 mt-1">SKU: {item.sku}</p>
                      </td>
                      <td className="px-8 py-6">
                        <input 
                          type="number" 
                          value={item.qty}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[itemIndex].qty = parseInt(e.target.value) || 0;
                            setItems(newItems);
                          }}
                          className="w-24 bg-white border border-[#c4c6cd] rounded-lg px-3 py-2 text-[14px] font-bold focus:ring-2 focus:ring-[#5cb8fd] outline-none"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 font-medium">{currency}</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={item.cost || item.price}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[itemIndex].cost = parseFloat(e.target.value) || 0;
                              setItems(newItems);
                            }}
                            className="w-28 bg-white border border-[#c4c6cd] rounded-lg px-3 py-2 text-[14px] font-bold focus:ring-2 focus:ring-[#5cb8fd] outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-[#162839] text-[15px]">
                        {formatCurrency(((+item.qty) * (+item.cost || +item.price || 0)), currency)}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleRemoveItem(itemIndex)}
                          className="p-2 text-neutral-400 hover:text-[#ba1a1a] transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-[#f8f9fa] border-t border-[#edeeef] flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-[14px] text-neutral-500">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-bold">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-[14px] text-neutral-500 pb-3 border-b border-[#edeeef]">
                  <span className="font-medium">Tax (8%):</span>
                  <span className="font-bold">{formatCurrency(tax, currency)}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-[20px] font-black text-[#162839]">Total:</span>
                  <span className="text-[24px] font-black text-[#162839] tracking-tight">
                    {formatCurrency(total, currency)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Remarks Card */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <h3 className="text-[18px] font-bold text-[#162839] mb-6">Special Instructions & Remarks</h3>
            <textarea 
              className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl p-4 text-[14px] font-medium text-neutral-600 outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all leading-relaxed"
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
          className="flex items-center gap-2 text-[#ba1a1a] font-bold text-[14px] px-6 py-3 rounded-lg hover:bg-red-50 transition-all uppercase tracking-widest"
        >
          <Trash className="w-5 h-5" />
          Cancel Purchase Order
        </button>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={fetchOrderData}
            className="flex-1 md:flex-none px-8 py-3 bg-[#e1e3e4] text-[#43474c] font-bold text-[14px] rounded-lg hover:bg-[#d9dadb] transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
            <RotateCcw className="w-5 h-5" />
            Revert Changes
          </button>
          <button 
            onClick={handleUpdate}
            className="flex-1 md:flex-none px-10 py-3 bg-[#006397] text-white font-bold text-[14px] rounded-lg hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <CheckCircle className="w-5 h-5" />
            Update Order
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
            <div className="p-3 bg-white rounded-xl text-[#162839] border border-[#edeeef]">
              <info.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{info.label}</p>
              <p className="text-[14px] font-bold text-[#162839]">{info.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
