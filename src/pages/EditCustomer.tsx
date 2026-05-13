import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  ArrowLeft,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../store';

export default function EditCustomer() {
  const { id } = useParams();
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    business_type: 'Retailer',
    tax_id: '',
    credit_limit: 0,
    payment_terms: 'Net 15',
    contact_person: '',
    email: '',
    phone: '',
    billing_address: '',
    shipping_address: '',
    sameAsBilling: false
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/customers/${id}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            ...data,
            credit_limit: parseFloat(data.credit_limit) || 0,
            sameAsBilling: data.billing_address === data.shipping_address
          });
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching customer:', err);
          showToast('Failed to load customer data', 'error');
          navigate('/customers');
        });
    }
  }, [id]);

  const handleSave = async () => {
    if (!formData.name) {
      showToast('Please enter customer name', 'error');
      return;
    }
    
    try {
      const { sameAsBilling, created_at, ...payload } = formData;
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          credit_limit: parseFloat(formData.credit_limit.toString()) || 0
        }),
      });

      if (response.ok) {
        showToast('Customer profile updated successfully!', 'success');
        navigate('/customers');
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to update customer', 'error');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      showToast('Network error occurred.', 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading customer details...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
              <Link to="/customers" className="hover:text-[#006397] transition-colors">Customers</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#006397] font-bold">Edit Customer</span>
            </nav>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/customers')}
                className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                title="Back to Customers"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-500" />
              </button>
              <h1 className="text-[32px] font-black text-[#162839] tracking-tight leading-none">Edit Customer</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/customers')}
              className="px-6 py-3 border border-[#edeeef] text-[#162839] text-[14px] font-bold rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-2"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-3 bg-[#001d31] text-white text-[14px] font-bold rounded-xl hover:bg-[#002d4d] transition-all flex items-center gap-2 shadow-lg shadow-[#001d31]/20"
            >
              <Save className="w-4 h-4" />
              Update Profile
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
                    <div className="relative">
                      <select 
                        value={formData.business_type}
                        onChange={e => setFormData({...formData, business_type: e.target.value})}
                        className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none appearance-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                      >
                        <option>Retailer</option>
                        <option>Wholesaler</option>
                        <option>Contractor</option>
                        <option>Government</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full col-span-2">
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">Rs</span>
                    <input 
                      type="number"
                      value={formData.opening_balance || 0}
                      onChange={e => setFormData({...formData, opening_balance: parseFloat(e.target.value) || 0})}
                      className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl pl-10 pr-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Credit Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                    <input 
                      type="number"
                      value={formData.credit_limit}
                      onChange={e => setFormData({...formData, credit_limit: Number(e.target.value)})}
                      className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl pl-8 pr-4 py-3 text-[14px] font-bold text-[#162839] outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Payment Terms</label>
                  <div className="relative">
                    <select 
                      value={formData.payment_terms}
                      onChange={e => setFormData({...formData, payment_terms: e.target.value})}
                      className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-bold text-[#162839] outline-none appearance-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                    >
                      <option>Net 15</option>
                      <option>Net 30</option>
                      <option>Due on Receipt</option>
                      <option>COD</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                 All financial history and activities will be logged under this profile. Ensure data integrity for accurate reporting.
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
