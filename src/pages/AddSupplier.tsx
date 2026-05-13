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
  DollarSign
} from 'lucide-react';
import { useAppContext } from '../store';

export default function AddSupplier() {
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
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
        <div className="md:col-span-2 bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                Supplier Name / Title *
              </label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Acme Raw Materials"
                className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                Category
              </label>
              <select 
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all appearance-none"
              >
                <option>Raw Materials</option>
                <option>Fuel & Power</option>
                <option>Logistics</option>
                <option>Spare Parts</option>
                <option>Office Supplies</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Contact Person
              </label>
              <input 
                type="text" 
                value={formData.contact_person}
                onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Name of primary contact"
                className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" />
                Opening Balance
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                <input 
                  type="number" 
                  value={formData.opening_balance}
                  onChange={e => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl pl-8 pr-4 py-3.5 text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>
              <p className="text-[11px] text-neutral-400 italic">Positive for credit, negative for debit.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="supplier@email.com"
                className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                Phone Number
              </label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                Office/Warehouse Address
              </label>
              <textarea 
                rows={3}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full physical address..."
                className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all resize-none"
              />
            </div>
          </div>

          <div className="pt-8 border-t border-[#edeeef] flex justify-end">
            <button 
              disabled={loading}
              type="submit" 
              className="flex items-center gap-2 px-10 py-4 bg-[#162839] text-white font-black rounded-xl hover:brightness-110 active:scale-95 transition-all text-[15px] shadow-lg shadow-black/10 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  SAVE SUPPLIER
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
