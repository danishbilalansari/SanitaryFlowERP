import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronRight, 
  Search, 
  Barcode, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  Info,
  ShieldCheck,
  Truck,
  Plus,
  Package,
  Factory,
  ChevronDown,
  Warehouse,
  ShoppingCart,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { useAppContext } from '../store';

export default function AddInventory() {
  const { id } = useParams();
  const isEdit = !!id;
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Ceramics',
    stock: 0,
    minStock: 10,
    price: 0,
    status: 'IN STOCK',
    description: '',
    warehouse: 'Central WH'
  });

  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      fetch(`/api/inventory/${id}`)
        .then(async res => {
          if (!res.ok) throw new Error('Failed to fetch item');
          const text = await res.text();
          return text ? JSON.parse(text) : {};
        })
        .then(data => {
          setFormData({
            ...data,
            stock: data.stock || 0,
            price: data.price || 0,
            minStock: data.minStock || 10,
            category: data.category || 'Ceramics',
            status: data.status || 'IN STOCK',
            description: data.description || '',
            warehouse: data.warehouse || 'Central WH'
          });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
          showToast('Failed to load item.', 'error');
        });
    }
  }, [id]);

  const handleConfirm = async () => {
    try {
      const url = isEdit ? `/api/inventory/${id}` : '/api/inventory';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stock: parseInt(formData.stock.toString()),
          price: parseFloat(formData.price.toString()),
          minStock: parseInt(formData.minStock.toString())
        }),
      });

      if (response.ok) {
        showToast(isEdit ? 'Item details updated.' : 'Shipment received and inventory updated.', 'success');
        navigate(isEdit ? `/inventory/${id}` : '/inventory');
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || `Failed to ${isEdit ? 'update' : 'log'} item.`, 'error');
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
      showToast('Network error occurred.', 'error');
    }
  };

  if (loading) return <div className="p-8">Loading item...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Breadcrumbs & Header */}
      <div>
        <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
          <Link to="/inventory" className="hover:text-[#006397] transition-colors">Inventory</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {isEdit && (
            <>
              <Link to={`/inventory/${id}`} className="hover:text-[#006397] transition-colors">Item Detail</Link>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-[#006397] font-bold">{isEdit ? 'Edit Item' : 'Stock In'}</span>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </button>
          <h1 className="text-[32px] font-bold text-[#162839] tracking-tight leading-none">{isEdit ? 'Edit Item' : 'Log Incoming Shipment'}</h1>
        </div>
        <p className="text-[16px] text-neutral-500 mt-2">{isEdit ? 'Update details and specifications for this inventory item.' : 'Record and verify items received from suppliers to update inventory levels.'}</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section className="bg-white p-8 rounded-2xl border border-[#edeeef] shadow-sm">
            <h3 className="text-[18px] font-bold text-[#162839] mb-8 flex items-center gap-3">
              <div className="p-2 bg-[#d1e4fb] text-[#006397] rounded-lg">
                <Package className="w-5 h-5" />
              </div>
              Item Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Item Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  placeholder="e.g. Precision Ball Valve" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">SKU Code</label>
                <div className="relative">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input 
                    type="text" 
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl pl-11 pr-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                    placeholder="Scan barcode or type SKU..." 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                >
                  <option>Ceramics</option>
                  <option>Faucets</option>
                  <option>Showers</option>
                  <option>Pipes & Fittings</option>
                  <option>Tools</option>
                  <option>Raw Material</option>
                  <option>Shop</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                >
                  <option>IN STOCK</option>
                  <option>OUT OF STOCK</option>
                  <option>DISCONTINUED</option>
                  <option>ACTIVE</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Stock Quantity</label>
                  <input 
                    type="number" 
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Unit Price ($)</label>
                  <input 
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Safety Stock (Min)</label>
                <input 
                  type="number" 
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none min-h-[100px]"
                  placeholder="Enter detailed description..."
                ></textarea>
              </div>

              <div className="col-span-2 flex justify-end gap-4 pt-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="px-8 py-3 border border-[#c4c6cd] text-[#162839] font-bold rounded-xl hover:bg-neutral-50 transition-all uppercase tracking-widest text-[14px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm}
                  className="px-8 py-3 bg-[#162839] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-[14px]"
                >
                  <CheckCircle className="w-5 h-5 text-[#5cb8fd]" />
                  {isEdit ? 'Update Details' : 'Confirm Entry'}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <section className="bg-neutral-50 p-6 rounded-2xl border border-dashed border-neutral-300">
             <h4 className="font-bold text-[#162839] mb-4 flex items-center gap-2">
               <Info className="w-5 h-5 text-[#006397]" />
               Entry Guidance
             </h4>
             <ul className="space-y-3 text-[13px] text-neutral-600">
               <li>• SKU must be unique across the entire inventory system.</li>
               <li>• Initial stock entries will be logged in the audit history.</li>
               <li>• Safety stock levels trigger automated reorder alerts.</li>
               <li>• Categorization helps in generating branch-specific reports.</li>
             </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
