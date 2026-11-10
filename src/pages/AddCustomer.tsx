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
import { GlassSelect, GlassToggle } from '../components/GlassUI';
import { invalidateApiCache } from '../lib/apiCache';

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

    const finalBusinessType = showNewBusinessTypeInput ? newBusinessType : formData.business_type || '';
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
        invalidateApiCache('/api/customers');
        invalidateApiCache('/api/reports/customer-summary-city-wise');
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
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-[30px] font-extrabold text-slate-900 tracking-tight leading-none">Add New Customer</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/customers')}
              className="px-6 py-2.5 glass-pill-button text-slate-700 text-[13.5px] font-semibold rounded-full flex items-center gap-2 cursor-pointer"
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-7 py-2.5 bg-gradient-to-r from-[#0284c7] to-sky-500 text-white text-[13.5px] font-semibold rounded-full hover:brightness-105 transition-all flex items-center gap-2 shadow-[0_6px_20px_rgba(2,132,199,0.28)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Creating...' : 'Create Profile'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Info Column */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Essential Info Card */}
            <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
              <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
                <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Essential Information</h3>
                  <p className="text-[13px] text-slate-500 font-medium">Customer name, business category, and registered tax ID.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Customer / Company Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                    placeholder="e.g. Acme Manufacturing Corp"
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Business Type</label>
                    <div className="space-y-2">
                      <div className="relative">
                        <GlassSelect 
                          value={showNewBusinessTypeInput ? 'ADD_NEW' : formData.business_type || ''}
                          onChange={handleBusinessTypeChange}
                        >
                          {businessTypes.map(t => <option key={t}>{t}</option>)}
                          <option value="ADD_NEW">+ Add New Type...</option>
                        </GlassSelect>
                      </div>
                      {showNewBusinessTypeInput && (
                        <input 
                          type="text"
                          value={newBusinessType}
                          onChange={e => setNewBusinessType(e.target.value)}
                          placeholder="Type customer business type..."
                          className="w-full border-2 border-sky-400 rounded-2xl px-4 py-3 text-[14px] font-bold outline-none animate-in slide-in-from-top-2 duration-300"
                          autoFocus
                        />
                      )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-1">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">City</label>
                    <input 
                      type="text"
                      value={formData.city || ''}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                      placeholder="e.g. Lahore"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Tax ID / NTN</label>
                    <input 
                      type="text"
                      value={formData.tax_id}
                      onChange={e => setFormData({...formData, tax_id: e.target.value})}
                      className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                      placeholder="Tax ID Number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Terms Card */}
            <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
              <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
                <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#f59e0b] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Financial Settings</h3>
                  <p className="text-[13px] text-slate-500 font-medium">Opening ledger balances and credit ceiling allowances.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Opening Balance</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{currency}</span>
                    <input 
                      type="number"
                      value={formData.opening_balance || 0}
                      onChange={e => setFormData({...formData, opening_balance: parseFloat(e.target.value) || 0})}
                      className="w-full rounded-2xl pl-12 pr-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Credit Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{currency}</span>
                    <input 
                      type="number" 
                      value={formData.credit_limit}
                      onChange={e => setFormData({...formData, credit_limit: Number(e.target.value)})}
                      className="w-full rounded-2xl pl-12 pr-4 py-3 text-[14px] font-bold text-slate-900 outline-none transition-all"
                      placeholder="e.g. 50000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Billing */}
              <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
                <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
                  <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Billing Address</h3>
                    <p className="text-[13px] text-slate-500 font-medium">Invoicing destination</p>
                  </div>
                </div>
                <div>
                  <textarea 
                    value={formData.billing_address}
                    onChange={e => setFormData({...formData, billing_address: e.target.value})}
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all min-h-[100px]" 
                    placeholder="Billing street address..." 
                  />
                </div>
              </div>

              {/* Shipping */}
              <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-emerald-600 flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Shipping Address</h3>
                      <p className="text-[13px] text-slate-500 font-medium">Delivery location</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/85 border border-white shadow-[0_2px_8px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,1)]">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Same as billing</span>
                    <GlassToggle
                      size="sm"
                      checked={formData.sameAsBilling}
                      onChange={checked => {
                        setFormData({
                          ...formData,
                          sameAsBilling: checked,
                          shipping_address: checked ? formData.billing_address : formData.shipping_address
                        });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <textarea 
                    value={formData.shipping_address}
                    onChange={e => setFormData({...formData, shipping_address: e.target.value})}
                    disabled={formData.sameAsBilling}
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all min-h-[100px] disabled:opacity-50" 
                    placeholder="Shipping street address..." 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
              <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
                <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#8b5cf6] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                  <Contact className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Contact Details</h3>
                  <p className="text-[13px] text-slate-500 font-medium">Primary company liaison</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Contact Person</label>
                  <input 
                    type="text"
                    value={formData.contact_person}
                    onChange={e => setFormData({...formData, contact_person: e.target.value})}
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                    placeholder="Person Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Email</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Phone</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="glass-card p-6 rounded-[28px] space-y-3">
               <h4 className="font-bold text-slate-900 text-[15px] flex items-center gap-2">
                 <Info className="w-4 h-4 text-[#0284c7]" />
                 Account Notice
               </h4>
               <p className="text-[12.5px] text-slate-600 font-medium leading-relaxed">
                 New accounts are created with <span className="font-bold text-[#0284c7]">Active</span> status by default. All financial history and activities will be logged under this profile.
               </p>
               <button 
                  onClick={() => navigate('/customers/logs')}
                  className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#0284c7] hover:text-sky-700 transition-colors uppercase tracking-widest cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  View Audit Logs
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
