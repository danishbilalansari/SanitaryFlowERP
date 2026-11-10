import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight, Search, Factory, Package } from 'lucide-react';
import { useAppContext } from '../store';
import { GlassSelect } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

export default function AddFactoryBatch() {
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const cachedInventory = peekApiCache<any[]>('/api/inventory', 60_000);
  const [inventory, setInventory] = useState<any[]>(() => Array.isArray(cachedInventory) ? cachedInventory : []);
  const [loading, setLoading] = useState<boolean>(() => !Array.isArray(cachedInventory));
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    target_qty: 0,
    category: 'Toilet', // Default sanitario category
    batch_number: `BCH-${Math.floor(Math.random() * 9000) + 1000}`
  });

  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cachedJsonFetch('/api/inventory', { credentials: 'include' }, 60_000)
      .then(data => {
        setInventory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching inventory:', err);
        setLoading(false);
      });
  }, []);

  const rawMaterials = inventory.filter(item => 
    (item.category || '').toLowerCase().includes('raw') || 
    ['powder', 'compound', 'clay', 'glaze'].some(token => item.name.toLowerCase().includes(token))
  );

  const filteredMaterials = rawMaterials.filter(m => 
    m.name.toLowerCase().includes(materialSearch.toLowerCase()) || 
    m.sku.toLowerCase().includes(materialSearch.toLowerCase())
  );

  const addMaterial = (m: any) => {
    if (selectedMaterials.find(item => item.inventory_id === m.id)) return;
    setSelectedMaterials([...selectedMaterials, { ...m, inventory_id: m.id, qty_consumed: 0 }]);
    setMaterialSearch('');
  };

  const removeMaterial = (id: number) => {
    setSelectedMaterials(selectedMaterials.filter(m => m.inventory_id !== id));
  };

  const updateMaterialQty = (id: number, qty: number) => {
    setSelectedMaterials(selectedMaterials.map(m => 
      m.inventory_id === id ? { ...m, qty_consumed: qty } : m
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!formData.product_id || formData.target_qty <= 0) {
      setError('Please select a product and enter a valid quantity.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        product_id: Number(formData.product_id),
        target_qty: Number(formData.target_qty),
        materials: selectedMaterials.map(m => ({
          inventory_id: Number(m.inventory_id),
          qty_consumed: Number(m.qty_consumed)
        })),
        status: 'Scheduled'
      };

      const response = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        invalidateApiCache('/api/production');
        invalidateApiCache('/api/factory/dashboard');
        invalidateApiCache('/api/analytics/dashboard');
        invalidateApiCache('/api/inventory');
        showToast('New production batch started!', 'success');
        navigate('/factory');
      } else {
        setError('Failed to create production batch.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full pb-20">
      <div className="flex items-center space-x-4">
        <Link to="/factory" className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/factory" className="hover:text-[#006397] transition-colors">Production</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">New Batch</span>
          </nav>
          <h1 className="text-[32px] font-black tracking-tight text-[#001d31] leading-none">Record Daily Production</h1>
          <p className="text-[13px] text-neutral-500 mt-2">Log production output and track raw material consumption.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Info */}
        <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6 flex flex-col">
          <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Batch Information</h3>
              <p className="text-[13px] text-slate-500 font-medium">Production target specifications</p>
            </div>
          </div>
          <div className="space-y-5 flex-1">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-[13px] font-medium mb-4">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Product Type (Sanitary Item)</label>
              <GlassSelect 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="Toilet">Toilet (Commode)</option>
                <option value="Sink">Sink / Pedestal</option>
                <option value="Urinal">Urinal</option>
                <option value="Bidet">Bidet</option>
                <option value="Tiles">Tiles & Ceramics</option>
                <option value="Fittings">Fittings & Accessories</option>
              </GlassSelect>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Specific Product <span className="text-red-500">*</span></label>
              <GlassSelect 
                value={formData.product_id}
                onChange={e => setFormData({...formData, product_id: e.target.value})}
              >
                <option value="">Select SKU...</option>
                {inventory.filter(i => i.category !== 'Raw Material').map(item => (
                  <option key={item.id} value={item.id}>{item.name} {item.color ? `- ${item.color}` : ''} ({item.sku})</option>
                ))}
              </GlassSelect>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Target Yield <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.target_qty}
                  onChange={e => setFormData({...formData, target_qty: Math.max(1, Number(e.target.value))})}
                  className="w-full rounded-2xl px-4 py-3 text-[14px] font-bold text-slate-900 outline-none transition-all" 
                  placeholder="e.g. 500" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">System Batch ID</label>
              <input 
                type="text" 
                readOnly
                value={formData.batch_number}
                className="w-full rounded-2xl px-4 py-3 text-[14px] bg-white/70 text-slate-500 outline-none font-mono font-bold" 
              />
            </div>
          </div>
        </div>

        {/* Material Consumption */}
        <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6 flex flex-col">
          <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-emerald-600 flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Raw Material Consumption</h3>
              <p className="text-[13px] text-slate-500 font-medium">Deduct components from storage</p>
            </div>
          </div>
          <div className="flex-1 space-y-5">
             <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input 
                  type="text"
                  value={materialSearch}
                  onChange={e => setMaterialSearch(e.target.value)}
                  placeholder="Search raw materials..."
                  className="w-full rounded-2xl py-3 pl-11 pr-4 text-[14px] font-medium text-slate-900 outline-none transition-all"
                />
                {materialSearch && (
                  <div className="absolute z-20 left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-white rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.1)] max-h-48 overflow-y-auto divide-y divide-slate-100">
                     {filteredMaterials.map(m => (
                       <button 
                        key={m.id}
                        type="button"
                        onClick={() => addMaterial(m)}
                        className="w-full px-4 py-3 text-left hover:bg-sky-50/60 flex justify-between items-center group transition-colors cursor-pointer"
                       >
                          <div>
                            <p className="text-[14px] font-bold text-slate-900">{m.name}</p>
                            <p className="text-[11px] text-slate-400 uppercase tracking-tight">{m.sku} • Stock: {m.stock}</p>
                          </div>
                          <span className="text-[11px] font-bold text-[#0284c7] opacity-0 group-hover:opacity-100 transition-opacity">ADD ITEM</span>
                       </button>
                     ))}
                  </div>
                )}
             </div>

             <div className="space-y-3">
                {selectedMaterials.map(m => (
                  <div key={m.inventory_id} className="p-4 bg-white/80 border border-white rounded-2xl flex items-center gap-4 shadow-2xs">
                     <div className="flex-1">
                        <p className="text-[13.5px] font-bold text-slate-900">{m.name}</p>
                        <p className="text-[11.5px] text-slate-400 font-medium">Available: {m.stock}</p>
                     </div>
                     <div className="w-24">
                        <input 
                          type="number"
                          value={m.qty_consumed}
                          onChange={e => updateMaterialQty(m.inventory_id, Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full rounded-xl px-3 py-1.5 text-[13px] font-bold outline-none"
                        />
                     </div>
                     <button 
                      type="button"
                      onClick={() => removeMaterial(m.inventory_id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-lg px-1"
                     >
                        &times;
                     </button>
                  </div>
                ))}
                {selectedMaterials.length === 0 && (
                  <div className="border border-dashed border-slate-200/80 rounded-2xl py-12 text-center text-slate-400 italic text-[13px]">
                     No materials added yet. Consumption will be recorded against the batch.
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 pt-4">
        <Link to="/factory" className="px-6 py-3 glass-pill-button text-[13.5px] font-semibold text-slate-700 hover:text-slate-900 rounded-full transition-all">
          Cancel
        </Link>
        <button 
          type="submit" 
          disabled={saving}
          className="px-7 py-3 text-[13.5px] font-semibold text-white bg-gradient-to-r from-[#0284c7] to-sky-500 hover:brightness-105 rounded-full transition-all shadow-[0_6px_20px_rgba(2,132,199,0.28)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving && (
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          <span>{saving ? 'Processing Batch...' : 'Log Production Entry'}</span>
        </button>
      </div>
    </form>
  );
}
