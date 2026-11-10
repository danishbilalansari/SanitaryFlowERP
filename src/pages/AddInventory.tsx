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
import { formatCurrency } from '../lib/currency';
import { GlassSelect } from '../components/GlassUI';
import { invalidateApiCache } from '../lib/apiCache';

export default function AddInventory() {
  const { id } = useParams();
  const isEdit = !!id;
  const { showToast, currency } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'uPVC Pipes',
    stock: 0,
    minStock: 10,
    price: 0,
    status: 'IN STOCK',
    description: '',
    brand: '',
    product_line: '',
    size: '',
    packing: '',
    unit: 'Piece',
    color: '',
    image: '',
    warehouse: 'Central WH'
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

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
            name: data.name || '',
            sku: data.sku || '',
            stock: data.stock || 0,
            price: data.price || 0,
            minStock: data.minStock || 10,
            category: data.category || 'uPVC Pipes',
            status: data.status || 'IN STOCK',
            description: data.description || '',
            brand: data.brand || '',
            product_line: data.product_line || '',
            size: data.size || '',
            packing: data.packing || '',
            unit: data.unit || 'Piece',
            color: data.color || '',
            image: data.image || '',
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

  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const categories = [
    'uPVC Pipes', 'uPVC Fittings', 'PPRC Pipes', 'PPRC Fittings', 
    'Jointing Solutions', 'Sanitary Ware', 'Accessories', 'Raw Material', 'Shop'
  ];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'ADD_NEW') {
      setShowNewCategoryInput(true);
      setFormData({ ...formData, category: '' });
    } else {
      setShowNewCategoryInput(false);
      setFormData({ ...formData, category: e.target.value });
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const url = isEdit ? `/api/inventory/${id}` : '/api/inventory';
      const method = isEdit ? 'PUT' : 'POST';
      
      const finalCategory = showNewCategoryInput ? newCategory : formData.category || '';
      if (showNewCategoryInput && !newCategory) {
        showToast('Please enter a category name', 'error');
        setSaving(false);
        return;
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category: finalCategory,
          stock: parseInt(formData.stock.toString()),
          price: parseFloat(formData.price.toString()),
          minStock: parseInt(formData.minStock.toString())
        }),
      });

      if (response.ok) {
        invalidateApiCache('/api/inventory');
        invalidateApiCache('/api/analytics/dashboard');
        showToast(isEdit ? 'Item details updated.' : 'Shipment received and inventory updated.', 'success');
        navigate(isEdit ? `/inventory/${id}` : '/inventory');
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || `Failed to ${isEdit ? 'update' : 'log'} item.`, 'error');
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
      showToast('Network error occurred.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-8">Loading item...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Breadcrumbs & Header */}
      <div>
        <nav className="flex items-center gap-2 text-[13px] font-medium text-slate-400 mb-2">
          <Link to="/inventory" className="hover:text-[#0284c7] transition-colors">Inventory</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {isEdit && (
            <>
              <Link to={`/inventory/${id}`} className="hover:text-[#0284c7] transition-colors">Item Detail</Link>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-[#0284c7] font-bold">{isEdit ? 'Edit Item' : 'Add New Item'}</span>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/90 border border-white flex items-center justify-center shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:bg-white transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">{isEdit ? 'Edit Item' : 'Add New Inventory Item'}</h1>
        </div>
        <p className="text-[15px] text-slate-500 mt-2">{isEdit ? 'Update details and specifications for this inventory item.' : 'Create a SKU with product line, size, packing, rate, and category details.'}</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section className="glass-card rounded-[30px] overflow-hidden">
            <div className="p-6 border-b border-slate-200/60 flex items-center gap-4 bg-white/40">
              <div className="w-10 h-10 rounded-2xl bg-white/95 border border-white shadow-[0_4px_12px_rgba(15,23,42,0.05)] flex items-center justify-center text-[#0284c7]">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-[17px] font-bold text-slate-900">Identified Information</h3>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Item Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-medium outline-none transition-all"
                    placeholder="e.g. Toilet Set (Ivory)" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">SKU Code / Model</label>
                  <div className="relative">
                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-[14px] font-medium outline-none transition-all"
                      placeholder="e.g. SKU-001-I" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Category</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <GlassSelect 
                        value={showNewCategoryInput ? 'ADD_NEW' : formData.category || ''}
                        onChange={handleCategoryChange}
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="ADD_NEW">+ Add New Category...</option>
                      </GlassSelect>
                    </div>
                    {showNewCategoryInput && (
                      <input 
                        type="text" 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-bold outline-none animate-in slide-in-from-top-2 duration-300"
                        placeholder="Type new category name..."
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Status</label>
                  <GlassSelect 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option>IN STOCK</option>
                    <option>OUT OF STOCK</option>
                    <option>DISCONTINUED</option>
                    <option>ACTIVE</option>
                  </GlassSelect>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[30px] overflow-hidden">
             <div className="p-6 border-b border-slate-200/60 flex items-center gap-4 bg-white/40">
                <div className="w-10 h-10 rounded-2xl bg-white/95 border border-white shadow-[0_4px_12px_rgba(15,23,42,0.05)] flex items-center justify-center text-amber-500">
                  <Info className="w-5 h-5" />
                </div>
                <h3 className="text-[17px] font-bold text-slate-900">Technical Specifications</h3>
             </div>
             
             <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-medium outline-none transition-all"
                    placeholder="e.g. World"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-medium outline-none transition-all"
                    placeholder="e.g. Ivory"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Size</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-medium outline-none transition-all"
                    placeholder="e.g. Standard"
                  />
                </div>
             </div>
          </section>

          <section className="glass-card rounded-[30px] overflow-hidden">
             <div className="p-6 border-b border-slate-200/60 flex items-center gap-4 bg-white/40">
                <div className="w-10 h-10 rounded-2xl bg-white/95 border border-white shadow-[0_4px_12px_rgba(15,23,42,0.05)] flex items-center justify-center text-emerald-600">
                  <Warehouse className="w-5 h-5" />
                </div>
                <h3 className="text-[17px] font-bold text-slate-900">Inventory & Rates</h3>
             </div>
             
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Stock Qty</label>
                  <input 
                    type="number" 
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-bold outline-none transition-all text-emerald-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Unit Price ({currency})</label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-bold outline-none transition-all text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Packing</label>
                  <input 
                    type="text" 
                    value={formData.packing}
                    onChange={(e) => setFormData({ ...formData, packing: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3.5 text-[14px] outline-none"
                    placeholder="e.g. 1 Box"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Unit</label>
                  <GlassSelect 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option>Piece</option>
                    <option>Set</option>
                    <option>Box</option>
                  </GlassSelect>
                </div>
             </div>
          </section>

          <div className="flex justify-end gap-4 pt-6">
            <button 
              onClick={() => navigate(-1)}
              className="px-8 py-3.5 glass-pill-button text-slate-700 font-semibold rounded-full transition-all text-[14px]"
            >
              Discard Changes
            </button>
            <button 
              onClick={handleConfirm}
              disabled={saving}
              className="px-10 py-3.5 glass-pill-button text-slate-900 font-semibold rounded-full transition-all flex items-center gap-3 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-[#0284c7] rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 text-[#0284c7]" />
              )}
              {saving ? 'Processing...' : (isEdit ? 'Update SKU' : 'Record SKU')}
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <section className="glass-card rounded-[30px] overflow-hidden">
            <div className="p-6 border-b border-slate-200/60 bg-white/40 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-slate-900">Product Image</h3>
            </div>
            <div className="p-8">
              <div 
                className="w-full aspect-square bg-white/60 rounded-2xl border-2 border-dashed border-slate-200/80 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-[#38bdf8] transition-all"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                {formData.image ? (
                  <>
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[13px] font-bold">Change Image</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, image: '' });
                      }}
                      className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-white/95 shadow-sm border border-white flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8 text-[#0284c7]" />
                    </div>
                    <p className="text-[14px] font-bold text-slate-600">Upload Image</p>
                    <p className="text-[12px] text-slate-400 mt-1 pb-4">JPG, PNG up to 2MB</p>
                  </>
                )}
                <input 
                  id="image-upload"
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </section>

          <section className="glass-card p-6 rounded-[28px]">
             <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
               <Info className="w-5 h-5 text-[#0284c7]" />
               Entry Guidance
             </h4>
             <ul className="space-y-3 text-[13px] text-slate-600">
               <li>• SKU must be unique across the entire inventory system.</li>
               <li>• Use product line/class for B Class, Medium, 10ft, and fitting families.</li>
               <li>• Enter size exactly as printed on supplier price lists.</li>
               <li>• Packing stores carton or bundle quantity such as 120 Piece.</li>
             </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
