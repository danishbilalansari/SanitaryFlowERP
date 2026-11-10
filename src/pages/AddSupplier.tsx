import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Tag,
  DollarSign,
  ChevronDown
} from 'lucide-react';
import { useAppContext } from '../store';
import { GlassSelect } from '../components/GlassUI';
import { invalidateApiCache } from '../lib/apiCache';

export default function AddSupplier() {
  const { showToast, currency } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    contact_person: '',
    email: '',
    phone: '',
    category: 'Raw Materials',
    address: '',
    opening_balance: 0
  });
  const categories = ['Raw Materials', 'Fuel & Power', 'Logistics', 'Spare Parts', 'Office Supplies'];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'ADD_NEW') {
      setShowNewCategoryInput(true);
      setFormData({ ...formData, category: '' });
    } else {
      setShowNewCategoryInput(false);
      setFormData({ ...formData, category: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCategory = showNewCategoryInput ? newCategory : formData.category || '';
    if (showNewCategoryInput && !newCategory) {
      showToast('Please enter category name', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, category: finalCategory })
      });

      if (res.ok) {
        invalidateApiCache('/api/suppliers');
        showToast('Supplier added successfully', 'success');
        navigate('/suppliers');
      } else {
        throw new Error('Failed to add supplier');
      }
    } catch (err) {
      console.error(err);
      showToast('Error adding supplier', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/suppliers" className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-[28px] font-black text-[#162839] tracking-tight leading-none">Add New Supplier</h2>
            <p className="text-[14px] text-neutral-500 mt-1 font-medium">Create a new partner relationship.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2 glass-card p-7 sm:p-9 rounded-[30px] space-y-8">
          <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Supplier Information</h3>
              <p className="text-[13px] text-slate-500 font-medium">Business entity details, primary contact, and starting ledger balance.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Supplier Name / Title <span className="text-red-500">*</span>
              </label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Acme Raw Materials"
                className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-medium text-slate-900 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Category
              </label>
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
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Enter supplier category"
                    className="w-full border-2 border-sky-400 rounded-2xl px-4 py-3 text-[14px] font-bold outline-none animate-in slide-in-from-top-2 duration-300"
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Contact Person
              </label>
              <input 
                type="text" 
                value={formData.contact_person}
                onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Name of primary contact"
                className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-medium text-slate-900 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Opening Balance
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{currency}</span>
                <input 
                  type="number" 
                  value={formData.opening_balance}
                  onChange={e => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-full rounded-2xl pl-12 pr-4 py-3.5 text-[14px] font-medium text-slate-900 outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium italic">Positive for credit, negative for debit.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="supplier@email.com"
                className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-medium text-slate-900 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Phone Number
              </label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-medium text-slate-900 outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Office/Warehouse Address
              </label>
              <textarea 
                rows={3}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full physical address..."
                className="w-full rounded-2xl px-4 py-3.5 text-[14px] font-medium text-slate-900 outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/60 flex justify-end">
            <button 
              disabled={loading}
              type="submit" 
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold rounded-full hover:brightness-105 transition-all text-[14px] shadow-[0_6px_20px_rgba(2,132,199,0.28)] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Supplier</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
