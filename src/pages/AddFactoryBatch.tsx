import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight, Search } from 'lucide-react';
import { useAppContext } from '../store';

export default function AddFactoryBatch() {
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    product_id: '',
    target_qty: 0,
    line: 'Line 1',
    category: 'Toilet', // Default sanitario category
    batch_number: `BCH-${Math.floor(Math.random() * 9000) + 1000}`
  });

  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/inventory')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch inventory');
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
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

    if (!formData.product_id || formData.target_qty <= 0) {
      setError('Please select a product and enter a valid quantity.');
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
        showToast('New production batch started!', 'success');
        navigate('/factory');
      } else {
        setError('Failed to create production batch.');
      }
    } catch (err) {
      setError('A network error occurred.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-20">
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
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
             <h3 className="font-bold text-[#162839] text-[16px]">Batch Information</h3>
          </div>
          <div className="p-6 space-y-6 flex-1">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">Product Type (Sanitary Item)</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full border border-neutral-200/80 rounded-xl py-3 px-4 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
              >
                <option value="Toilet">Toilet (Commode)</option>
                <option value="Sink">Sink / Pedestal</option>
                <option value="Urinal">Urinal</option>
                <option value="Bidet">Bidet</option>
                <option value="Tiles">Tiles & Ceramics</option>
                <option value="Fittings">Fittings & Accessories</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">Specific Product *</label>
              <select 
                value={formData.product_id}
                onChange={e => setFormData({...formData, product_id: e.target.value})}
                className="w-full border border-neutral-200/80 rounded-xl py-3 px-4 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all bg-neutral-50 focus:bg-white"
              >
                <option value="">Select SKU...</option>
                {inventory.filter(i => i.category !== 'Raw Material').map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">Target Yield *</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.target_qty}
                  onChange={e => setFormData({...formData, target_qty: Math.max(1, Number(e.target.value))})}
                  className="w-full border border-neutral-200/80 rounded-xl py-3 px-4 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all" 
                  placeholder="e.g. 500" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">Production Line</label>
                <select 
                  value={formData.line}
                  onChange={e => setFormData({...formData, line: e.target.value})}
                  className="w-full border border-neutral-200/80 rounded-xl py-3 px-4 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                >
                  <option value="Line 1">Molding A-1</option>
                  <option value="Line 2">Kiln Floor B-2</option>
                  <option value="Line 3">Glazing Station</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">System Batch ID</label>
              <input 
                type="text" 
                readOnly
                value={formData.batch_number}
                className="w-full border border-neutral-100 rounded-xl py-3 px-4 text-[14px] bg-neutral-50 text-neutral-400 outline-none font-mono" 
              />
            </div>
          </div>
        </div>

        {/* Material Consumption */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
             <h3 className="font-bold text-[#162839] text-[16px]">Raw Material Consumption</h3>
          </div>
          <div className="p-6 flex-1 space-y-6">
             <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="w-4 h-4 text-neutral-400" />
                </div>
                <input 
                  type="text"
                  value={materialSearch}
                  onChange={e => setMaterialSearch(e.target.value)}
                  placeholder="Search raw materials..."
                  className="w-full border border-neutral-200/80 rounded-xl py-3 pl-11 pr-4 text-[14px] outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
                {materialSearch && (
                  <div className="absolute z-10 left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y">
                     {filteredMaterials.map(m => (
                       <button 
                        key={m.id}
                        type="button"
                        onClick={() => addMaterial(m)}
                        className="w-full px-4 py-3 text-left hover:bg-neutral-50 flex justify-between items-center group"
                       >
                          <div>
                            <p className="text-[14px] font-bold text-[#162839]">{m.name}</p>
                            <p className="text-[11px] text-neutral-400 uppercase tracking-tight">{m.sku} • Stock: {m.stock}</p>
                          </div>
                          <span className="text-[11px] font-black text-[#5cb8fd] opacity-0 group-hover:opacity-100 transition-opacity">ADD ITEM</span>
                       </button>
                     ))}
                  </div>
                )}
             </div>

             <div className="space-y-3">
                {selectedMaterials.map(m => (
                  <div key={m.inventory_id} className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center gap-4">
                     <div className="flex-1">
                        <p className="text-[13px] font-bold text-[#162839]">{m.name}</p>
                        <p className="text-[11px] text-neutral-400">Available: {m.stock}</p>
                     </div>
                     <div className="w-24">
                        <input 
                          type="number"
                          value={m.qty_consumed}
                          onChange={e => updateMaterialQty(m.inventory_id, Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#5cb8fd]"
                        />
                     </div>
                     <button 
                      type="button"
                      onClick={() => removeMaterial(m.inventory_id)}
                      className="text-neutral-300 hover:text-red-500 transition-colors"
                     >
                        &times;
                     </button>
                  </div>
                ))}
                {selectedMaterials.length === 0 && (
                  <div className="border-2 border-dashed border-neutral-100 rounded-2xl py-12 text-center text-neutral-400 italic text-[13px]">
                     No materials added yet. Consumption will be recorded against the batch.
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Link to="/factory" className="px-8 py-3.5 text-[14px] font-bold text-neutral-500 hover:text-neutral-900 transition-colors">
          Cancel
        </Link>
        <button type="submit" className="px-10 py-3.5 text-[14px] font-black text-white bg-[#162839] hover:brightness-110 rounded-xl transition-all shadow-lg shadow-[#162839]/20">
          LOG PRODUCTION ENTRY
        </button>
      </div>
    </form>
  );
}
