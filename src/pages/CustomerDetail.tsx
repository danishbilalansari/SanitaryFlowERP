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

export default function CustomerDetail() {
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
        <div className="bg-white border border-[#edeeef] rounded-xl p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <User className="w-48 h-48 text-[#006397]" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-[#d1e4fb] flex items-center justify-center text-[#162839] shadow-inner">
                <span className="text-2xl font-black">{customer.name.substring(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-[30px] font-bold text-[#162839] tracking-tight">{customer.name}</h2>
                  <span className="bg-[#e3f2fd] text-[#006397] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{customer.business_type}</span>
                </div>
                <p className="text-[14px] text-neutral-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4" />
                  {customer.city ? `${customer.city}, ` : ''}{customer.billing_address}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-12">
              <div className="text-right">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">TOTAL DEBIT (Receivable)</p>
                <p className="text-[28px] font-bold text-[#162839] leading-none">Rs {totalDebit.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">CURRENT BALANCE</p>
                <p className={`text-[28px] font-bold leading-none ${balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  Rs {Math.abs(balance).toLocaleString()}
                  <span className="text-[12px] block mt-1">{balance > 0 ? '(Pending)' : '(Credit)'}</span>
                </p>
              </div>
              <button 
                onClick={() => navigate(`/customers/edit/${id}`)}
                className="p-2.5 bg-white border border-[#edeeef] text-[#162839] rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
              >
                <Edit2 className="w-5 h-5" />
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
          <div className="bg-white border border-[#edeeef] rounded-xl p-6 shadow-sm">
            <h3 className="text-[18px] font-bold text-[#162839] mb-6 flex items-center gap-3">
               <div className="p-1 bg-[#f3f4f5] rounded">
                 <Mail className="w-4 h-4 text-[#162839]" />
               </div>
               Primary Details
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f8f9fa] rounded-lg">
                   <User className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest leading-tight">Contact Person</p>
                  <p className="text-[14px] font-bold text-[#162839] mt-0.5">{customer.contact_person || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f8f9fa] rounded-lg">
                   <Mail className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest leading-tight">Email</p>
                  <p className="text-[14px] font-bold text-[#006397] mt-0.5">{customer.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f8f9fa] rounded-lg">
                   <Phone className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest leading-tight">Phone</p>
                  <p className="text-[14px] font-bold text-[#162839] mt-0.5">{customer.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f8f9fa] rounded-lg">
                   <Zap className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest leading-tight">Tax ID/NTN</p>
                  <p className="text-[14px] font-bold text-[#162839] mt-0.5">{customer.tax_id || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Right Col: Ledger */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#f3f4f5] px-6 py-4 border-b border-[#edeeef] flex justify-between items-center">
            <h3 className="text-[18px] font-bold text-[#162839] flex items-center gap-3">
              <Receipt className="w-5 h-5 text-[#162839]" />
              Customer Master Ledger
            </h3>
            <button 
              onClick={() => navigate(`/customers/ledger/${id}`)}
              className="text-[12px] font-bold text-[#006397] hover:underline flex items-center gap-1"
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
                      <td className="px-6 py-5 text-right font-bold text-[#162839]">{e.debit > 0 ? `Rs ${e.debit.toLocaleString()}` : '-'}</td>
                      <td className="px-6 py-5 text-right font-bold text-emerald-500">{e.credit > 0 ? `Rs ${e.credit.toLocaleString()}` : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-[#162839]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#edeeef] flex items-center justify-between bg-neutral-50">
               <h3 className="font-bold text-[#162839] flex items-center gap-2">
                 <DollarSign className="w-5 h-5 text-[#006397]" />
                 Post Customer Payment
               </h3>
               <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-neutral-200 rounded transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Amount</label>
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">Rs</span>
                   <input 
                     type="number"
                     value={paymentData.amount}
                     onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                     className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl pl-12 pr-4 py-3 text-[18px] font-bold text-[#162839] outline-none focus:ring-2 focus:ring-[#006397]"
                     placeholder="0.00"
                   />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Payment Date</label>
                   <input 
                     type="date"
                     value={paymentData.date}
                     onChange={e => setPaymentData({...paymentData, date: e.target.value})}
                     className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                   />
                 </div>
                 <div>
                   <label className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Reference ID</label>
                   <input 
                     type="text"
                     value={paymentData.reference_id}
                     onChange={e => setPaymentData({...paymentData, reference_id: e.target.value})}
                     className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                     placeholder="Ref #"
                   />
                 </div>
               </div>
               <div>
                  <label className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Description</label>
                  <textarea 
                    value={paymentData.description}
                    onChange={e => setPaymentData({...paymentData, description: e.target.value})}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none min-h-[80px]"
                    placeholder="Notes about payment..."
                  />
               </div>
            </div>
            <div className="p-6 bg-neutral-50 border-t border-[#edeeef] flex gap-3">
               <button 
                 onClick={() => setShowPaymentModal(false)}
                 className="flex-1 py-3 border border-[#edeeef] text-[#162839] font-bold text-[14px] rounded-xl hover:bg-white transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleRecordPayment}
                 disabled={!paymentData.amount || parseFloat(paymentData.amount) <= 0}
                 className="flex-1 py-3 bg-[#006397] text-white font-bold text-[14px] rounded-xl hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#006397]/20"
               >
                 Post Receipt
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
