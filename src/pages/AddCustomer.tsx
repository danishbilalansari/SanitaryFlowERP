import { formatCurrency } from '../lib/currency';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Save, 
  BadgeCheck, 
  Landmark, 
  Contact, 
  Receipt, 
  Truck, 
  Info,
  History,
  CheckCircle2,
  ChevronDown,
  Factory,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../store';

export default function AddCustomer() {
  const { showToast, currency } = useAppContext();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    business_type: 'Retailer',
    tax_id: '',
    credit_limit: 0,
    contact_person: '',
    email: '',
    phone: '',
    billing_address: '',
    shipping_address: '',
    sameAsBilling: false,
    opening_balance: 0,
    city: ''
  });

  const [newBusinessType, setNewBusinessType] = useState('');
  const [showNewBusinessTypeInput, setShowNewBusinessTypeInput] = useState(false);
  const businessTypes = ['Retailer', 'Wholesaler', 'Contractor', 'Government', 'Dealer', 'End User'];

  const handleBusinessTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'ADD_NEW') {
      setShowNewBusinessTypeInput(true);
      setFormData({ ...formData, business_type: '' });
    } else {
      setShowNewBusinessTypeInput(false);
      setFormData({ ...formData, business_type: e.target.value });
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      showToast('Please enter customer name', 'error');
      return;
    }

    const finalBusinessType = showNewBusinessTypeInput ? newBusinessType : formData.business_type;
    if (showNewBusinessTypeInput && !newBusinessType) {
      showToast('Please enter business type', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const { sameAsBilling, ...payload } = formData;
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          business_type: finalBusinessType,
          credit_limit: parseFloat(formData.credit_limit.toString()) || 0
        }),
      });

      if (response.ok) {
        showToast('Customer profile created successfully!', 'success');
        navigate('/customers');
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to create customer', 'error');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      showToast('Network error occurred.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
              <Link to="/customers" className="hover:text-[#006397] transition-colors">Customers</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#006397] font-bold">Add New Customer</span>
            </nav>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/customers')}
                className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                title="Back to Customers"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-500" />
              </button>
              <h1 className="text-[32px] font-black text-[#162839] tracking-tight leading-none">Add New Customer</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/customers')}
              className="px-6 py-3 border border-[#edeeef] text-[#162839] text-[14px] font-bold rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-2"
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-[#001d31] text-white text-[14px] font-bold rounded-xl hover:bg-[#002d4d] transition-all flex items-center gap-2 shadow-lg shadow-[#001d31]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Info Column */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Essential Info Card */}
            <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#edeeef] flex items-center gap-4 bg-[#f8f9fa]">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#006397]">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <h3 className="text-[17px] font-bold text-[#162839]">Essential Information</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Customer / Company Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                    placeholder="e.g. Acme Manufacturing Corp"
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#162839] block">Business Type</label>
                    <div className="space-y-2">
                      <div className="relative">
                        <select 
                          value={showNewBusinessTypeInput ? 'ADD_NEW' : formData.business_type}
                          onChange={handleBusinessTypeChange}
                          className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none appearance-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                        >
                          {businessTypes.map(t => <option key={t}>{t}</option>)}
                          <option value="ADD_NEW">+ Add New Type...</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {showNewBusinessTypeInput && (
                        <input 
                          type="text"
                          value={newBusinessType}
                          onChange={e => setNewBusinessType(e.target.value)}
                          placeholder="Type customer business type..."
                          className="w-full bg-white border-2 border-[#5cb8fd] rounded-xl px-4 py-3 text-[14px] font-bold outline-none animate-in slide-in-from-top-2 duration-300"
                          autoFocus
                        />
                      )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#162839] block">City</label>
                    <input 
                      type="text"
                      value={formData.city || ''}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                      placeholder="e.g. Lahore"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#162839] block">Tax ID / NTN</label>
                    <input 
                      type="text"
                      value={formData.tax_id}
                      onChange={e => setFormData({...formData, tax_id: e.target.value})}
                      className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                      placeholder="Tax ID Number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Terms Card */}
            <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#edeeef] flex items-center gap-4 bg-[#f8f9fa]">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#ff6a00]">
                  <Landmark className="w-5 h-5" />
                </div>
                <h3 className="text-[17px] font-bold text-[#162839]">Financial Settings</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Opening Balance</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">{currency}</span>
                    <input 
                      type="number"
                      value={formData.opening_balance || 0}
                      onChange={e => setFormData({...formData, opening_balance: parseFloat(e.target.value) || 0})}
                      className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl pl-12 pr-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Credit Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">{currency}</span>
                    <input 
                      type="number" 
                      value={formData.credit_limit}
                      onChange={e => setFormData({...formData, credit_limit: Number(e.target.value)})}
                      className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl pl-12 pr-4 py-3 text-[14px] font-bold text-[#162839] outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                      placeholder="e.g. 50000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Billing */}
              <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#edeeef] flex items-center gap-4 bg-[#f8f9fa]">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#2563eb]">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <h3 className="text-[17px] font-bold text-[#162839]">Billing</h3>
                </div>
                <div className="p-6 space-y-4">
                  <textarea 
                    value={formData.billing_address}
                    onChange={e => setFormData({...formData, billing_address: e.target.value})}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all min-h-[100px]" 
                    placeholder="Billing street address..." 
                  />
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#edeeef] flex flex-col gap-2 bg-[#f8f9fa]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#16a34a]">
                        <Truck className="w-5 h-5" />
                      </div>
                      <h3 className="text-[17px] font-bold text-[#162839]">Shipping</h3>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Same</span>
                      <input 
                        type="checkbox" 
                        checked={formData.sameAsBilling}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormData({
                            ...formData,
                            sameAsBilling: checked,
                            shipping_address: checked ? formData.billing_address : formData.shipping_address
                          });
                        }}
                        className="peer h-4 w-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <textarea 
                    value={formData.shipping_address}
                    onChange={e => setFormData({...formData, shipping_address: e.target.value})}
                    disabled={formData.sameAsBilling}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all min-h-[100px] disabled:opacity-50" 
                    placeholder="Shipping street address..." 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#edeeef] flex items-center gap-4 bg-[#f8f9fa]">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#9333ea]">
                  <Contact className="w-5 h-5" />
                </div>
                <h3 className="text-[17px] font-bold text-[#162839]">Contact Details</h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Contact Person</label>
                  <input 
                    type="text"
                    value={formData.contact_person}
                    onChange={e => setFormData({...formData, contact_person: e.target.value})}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                    placeholder="Person Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Email</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Phone</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="bg-neutral-50 p-6 rounded-2xl border border-dashed border-neutral-300">
               <h4 className="font-bold text-[#162839] mb-4 flex items-center gap-2">
                 <Info className="w-5 h-5 text-[#006397]" />
                 Account Notice
               </h4>
               <p className="text-[13px] text-neutral-600 leading-relaxed">
                 New accounts are created with <span className="font-bold text-[#006397]">Active</span> status by default. All financial history and activities will be logged under this profile.
               </p>
               <button 
                  onClick={() => navigate('/customers/logs')}
                  className="mt-6 flex items-center gap-2 text-[12px] font-bold text-neutral-400 hover:text-[#162839] transition-colors uppercase tracking-widest"
                >
                  <History className="w-4 h-4" />
                  Audit Logs
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
