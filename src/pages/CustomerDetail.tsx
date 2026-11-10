import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Edit2, 
  FileText, 
  CreditCard, 
  Receipt,
  Download,
  Filter,
  ChevronRight,
  TrendingUp,
  Zap,
  ShoppingCart,
  History,
  Info,
  X,
  Calendar,
  DollarSign
} from 'lucide-react';
import { GlassDatePicker, GlassModal } from '../components/GlassUI';

export default function CustomerDetail() {
  const { currency } = useAppContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    type: 'received',
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference_id: ''
  });

  const fetchData = async () => {
    try {
      const [custRes, ledgeRes] = await Promise.all([
        fetch(`/api/customers/${id}`),
        fetch(`/api/ledger?customer_id=${id}`)
      ]);
      const cust = await custRes.json();
      const ledge = await ledgeRes.json();
      setCustomer(cust);
      setLedger(ledge);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRecordPayment = async () => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: id,
          ...paymentData,
          amount: parseFloat(paymentData.amount)
        })
      });
      if (res.ok) {
        setShowPaymentModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Payment Error:', error);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-neutral-500 font-bold animate-pulse">Loading Customer Profile...</div>;
  if (!customer) return <div className="p-12 text-center text-red-500 font-bold">Profile not found.</div>;

  const totalDebit = ledger.reduce((sum, entry) => sum + (entry.debit || 0), 0);
  const totalCredit = ledger.reduce((sum, entry) => sum + (entry.credit || 0), 0);
  const balance = totalDebit - totalCredit;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Customer Hero Section */}
      <section>
        <div className="glass-card p-8 sm:p-10 rounded-[32px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <User className="w-48 h-48 text-[#0284c7]" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[22px] bg-gradient-to-tr from-sky-100 to-white border border-white flex items-center justify-center text-slate-800 shadow-[0_4px_16px_rgba(2,132,199,0.12)]">
                <span className="text-xl font-black text-[#0284c7]">{customer.name.substring(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">{customer.name}</h2>
                  <span className="bg-sky-100/80 border border-sky-200/80 text-[#0284c7] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">{customer.business_type}</span>
                </div>
                <p className="text-[13.5px] text-slate-500 font-medium flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {customer.city ? `${customer.city}, ` : ''}{customer.billing_address}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 sm:gap-10">
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL DEBIT</p>
                <p className="text-[26px] font-extrabold text-emerald-600 leading-none">{formatCurrency(totalDebit, currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">CURRENT BALANCE</p>
                <p className={`text-[26px] font-extrabold leading-none ${balance > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {formatCurrency(Math.abs(balance), currency)}
                  <span className="text-[11px] block mt-1 font-semibold text-slate-500">{balance > 0 ? '(Pending)' : '(Credit)'}</span>
                </p>
              </div>
              <button 
                onClick={() => navigate(`/customers/edit/${id}`)}
                className="w-10 h-10 rounded-full glass-pill-button text-slate-700 hover:text-[#0284c7] flex items-center justify-center transition-all cursor-pointer"
                title="Edit Customer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Col: Info & Metrics */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          {/* Contact Info */}
          <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
               <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                 <Mail className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Primary Details</h3>
                 <p className="text-[13px] text-slate-500 font-medium">Customer contact channel</p>
               </div>
            </div>
            <div className="space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/90 border border-white shadow-2xs flex items-center justify-center text-slate-400 shrink-0">
                   <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Contact Person</p>
                  <p className="text-[14px] font-bold text-slate-900 mt-1">{customer.contact_person || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/90 border border-white shadow-2xs flex items-center justify-center text-slate-400 shrink-0">
                   <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Email</p>
                  <p className="text-[14px] font-bold text-[#0284c7] mt-1">{customer.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/90 border border-white shadow-2xs flex items-center justify-center text-slate-400 shrink-0">
                   <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Phone</p>
                  <p className="text-[14px] font-bold text-slate-900 mt-1">{customer.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/90 border border-white shadow-2xs flex items-center justify-center text-slate-400 shrink-0">
                   <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Tax ID / NTN</p>
                  <p className="text-[14px] font-bold text-slate-900 mt-1">{customer.tax_id || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Ledger */}
        <div className="col-span-12 lg:col-span-8 glass-table-container rounded-[30px] overflow-hidden flex flex-col">
          <div className="p-6 sm:p-7 border-b border-slate-200/60 bg-white/40 flex justify-between items-center">
            <h3 className="text-[18px] font-bold text-slate-900 flex items-center gap-3">
              <Receipt className="w-5 h-5 text-[#0284c7]" />
              Customer Master Ledger
            </h3>
            <button 
              onClick={() => navigate(`/customers/ledger/${id}`)}
              className="text-[12px] font-bold text-[#0284c7] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Full Ledger View <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f8f9fa] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Debit</th>
                  <th className="px-6 py-4 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="text-[14px] divide-y divide-[#edeeef]">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 italic">No ledger activity recorded yet.</td>
                  </tr>
                ) : (
                  ledger.slice(0, 10).map((e, i) => (
                    <tr key={i} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="px-6 py-5 text-neutral-500 font-medium">
                        {new Date(e.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 font-bold text-[#162839]">{e.reference_id}</td>
                      <td className="px-6 py-5">
                         <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">{e.account_type}</span>
                         <p className="text-[11px] text-neutral-400 truncate max-w-[150px]">{e.description}</p>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-emerald-500">{e.debit > 0 ? formatCurrency(e.debit, currency) : '-'}</td>
                      <td className="px-6 py-5 text-right font-bold text-red-500">{e.credit > 0 ? formatCurrency(e.credit, currency) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <GlassModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        maxWidth="max-w-md w-full"
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
             <DollarSign className="w-3.5 h-3.5 text-[#0284c7]" />
             <span className="text-[13px] font-semibold text-slate-800">Post Customer Payment</span>
           </div>
           <button
             type="button"
             onClick={() => setShowPaymentModal(false)}
             className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
           >
             <X className="w-4 h-4" />
           </button>
        </div>
        <div className="space-y-4">
           <div>
             <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5 block">AMOUNT</label>
             <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
               <input 
                 type="number"
                 value={paymentData.amount}
                 onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                 className="w-full rounded-2xl bg-white/90 border border-white pl-12 pr-4 py-3.5 text-[18px] font-bold text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40"
                 placeholder="0.00"
               />
             </div>
           </div>
           <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5 block">PAYMENT DATE</label>
               <GlassDatePicker
                 value={paymentData.date}
                 onChange={e => setPaymentData({...paymentData, date: e.target.value})}
               />
             </div>
             <div>
               <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5 block">REFERENCE ID</label>
               <input 
                 type="text"
                 value={paymentData.reference_id}
                 onChange={e => setPaymentData({...paymentData, reference_id: e.target.value})}
                 className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3 text-[13.5px] font-medium text-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40"
                 placeholder="Ref #"
               />
             </div>
           </div>
           <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5 block">DESCRIPTION</label>
              <textarea 
                value={paymentData.description}
                onChange={e => setPaymentData({...paymentData, description: e.target.value})}
                className="w-full rounded-2xl bg-white/90 border border-white p-4 text-[14px] font-medium text-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 min-h-[88px] resize-none"
                placeholder="Notes about payment..."
              />
           </div>
        </div>
        <div className="pt-5 flex items-center justify-end gap-3">
           <button 
             type="button"
             onClick={() => setShowPaymentModal(false)}
             className="px-6 py-2.5 rounded-full bg-white/90 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all cursor-pointer"
           >
             Cancel
           </button>
           <button 
             type="button"
             onClick={handleRecordPayment}
             disabled={!paymentData.amount || parseFloat(paymentData.amount) <= 0}
             className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
           >
             <span className="text-[#0284c7] font-bold">✓</span>
             <span>Save Changes</span>
           </button>
        </div>
      </GlassModal>
    </div>
  );
}
