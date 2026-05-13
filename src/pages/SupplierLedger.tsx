import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CalendarDays, 
  Download, 
  Printer, 
  Search, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Wallet,
  Plus
} from 'lucide-react';
import { useAppContext } from '../store';

export default function SupplierLedger() {
  const { id } = useParams();
  const { showToast } = useAppContext();
  const [supplier, setSupplier] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, ledRes] = await Promise.all([
          fetch(`/api/suppliers`),
          fetch(`/api/ledger?supplier_id=${id}`)
        ]);
        
        const suppliers = await supRes.json();
        const ledgerData = await ledRes.json();
        
        const currentSupplier = suppliers.find((s: any) => s.id === Number(id));
        setSupplier(currentSupplier);
        setLedger(ledgerData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        showToast('Error fetching ledger data', 'error');
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: id,
          amount: Number(paymentAmount),
          type: 'given',
          description: paymentDesc || `Payment to ${supplier.name}`
        })
      });

      if (res.ok) {
        showToast('Payment recorded!', 'success');
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentDesc('');
        // Refresh data
        window.location.reload();
      } else {
        throw new Error('Payment failed');
      }
    } catch (err) {
      showToast('Failed to record payment', 'error');
    }
  };

  if (loading) return <div className="p-20 text-center text-neutral-400">Loading ledger...</div>;
  if (!supplier) return <div className="p-20 text-center text-red-500">Supplier not found.</div>;

  let runningBalance = 0;
  const ledgerWithBalance = ledger.map(entry => {
    // For suppliers: Credit increases balance (we owe more), Debit decreases (we paid)
    runningBalance += (entry.credit || 0) - (entry.debit || 0);
    return { ...entry, balance: runningBalance };
  }).reverse(); // Latest first for display

  const totalDebit = ledger.reduce((acc, curr) => acc + (curr.debit || 0), 0);
  const totalCredit = ledger.reduce((acc, curr) => acc + (curr.credit || 0), 0);
  const currentBalance = totalCredit - totalDebit;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/suppliers" className="hover:text-[#006397] transition-colors">Suppliers</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Ledger</span>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/suppliers" className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 transition-all">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">{supplier.name}</h2>
              <p className="text-[16px] text-neutral-500 mt-1">Transaction history and balance tracking.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 font-bold rounded-lg hover:bg-neutral-50 transition-all text-[14px]">
            <Printer className="w-4 h-4" />
            Print Statement
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Current Balance</p>
            <h3 className={`text-[32px] font-bold leading-none ${currentBalance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
               ${Math.abs(currentBalance).toLocaleString()}
            </h3>
            <p className="mt-2 text-[12px] font-medium text-neutral-400">
               {currentBalance > 0 ? 'Amount Payable' : 'Credit Balance'}
            </p>
         </div>

         <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Total Purchases</p>
            <h3 className="text-[32px] font-bold text-[#162839] leading-none">${totalCredit.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-1.5 text-emerald-500 text-[13px] font-bold">
               <TrendingUp className="w-4 h-4" />
               <span>Lifetime supply</span>
            </div>
         </div>

         <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Total Paid</p>
            <h3 className="text-[32px] font-bold text-[#162839] leading-none">${totalDebit.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-1.5 text-blue-500 text-[13px] font-bold">
               <Wallet className="w-4 h-4" />
               <span>Settled invoices</span>
            </div>
         </div>

         <div className="bg-[#2c3e50] p-8 rounded-2xl shadow-xl flex items-center justify-center">
             <button onClick={() => setShowPaymentModal(true)} className="flex flex-col items-center gap-3 text-white group">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all shadow-lg ring-1 ring-white/20">
                   <Plus className="w-7 h-7" />
                </div>
                <span className="text-[14px] font-black uppercase tracking-widest text-[#5cb8fd]">Post Payment</span>
             </button>
         </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                 <h3 className="text-[18px] font-bold text-[#162839]">Record Supplier Payment</h3>
                 <button onClick={() => setShowPaymentModal(false)} className="text-neutral-400 hover:text-neutral-600">&times;</button>
              </div>
              <form onSubmit={handlePostPayment} className="p-6 space-y-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Amount to Pay ($)</label>
                    <input 
                      required
                      type="number" 
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl px-4 py-3.5 text-[18px] font-black text-[#162839] outline-none focus:ring-2 focus:ring-[#5cb8fd]"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Description (Optional)</label>
                    <textarea 
                      value={paymentDesc}
                      onChange={e => setPaymentDesc(e.target.value)}
                      placeholder="Cheque #, Bank Transfer Ref..."
                      className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#5cb8fd] resize-none"
                      rows={3}
                    />
                 </div>
                 <button type="submit" className="w-full bg-[#162839] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg">
                    Confirm Payment
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
         <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
            <h3 className="font-bold text-[#162839] flex items-center gap-3 text-[18px]">
                <CalendarDays className="w-5 h-5 text-neutral-400" />
                All Transactions
            </h3>
            <div className="flex gap-4">
               <div className="relative">
                  <Search className="w-4 h-4 text-neutral-300 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search entries..." className="bg-white border border-neutral-200 rounded-lg pl-10 pr-4 py-2 text-[13px] outline-none focus:ring-1 focus:ring-[#5cb8fd]" />
               </div>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-white text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                     <th className="px-8 py-5">Date</th>
                     <th className="px-8 py-5">Description</th>
                     <th className="px-8 py-5">Reference</th>
                     <th className="px-8 py-5 text-right">Debit (Paid)</th>
                     <th className="px-8 py-5 text-right">Credit (Purchased)</th>
                     <th className="px-8 py-5 text-right">Running Balance</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-neutral-50 text-[14px]">
                  {ledgerWithBalance.map((entry, idx) => (
                     <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-8 py-5 text-[#162839] font-medium">
                           {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-5">
                           <p className="font-bold text-[#162839]">{entry.description}</p>
                           <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-tight">{entry.account_type}</p>
                        </td>
                        <td className="px-8 py-5">
                           <span className="bg-neutral-100 text-neutral-600 px-3 py-1 rounded text-[12px] font-bold flex items-center gap-2 w-fit">
                              {entry.reference_id}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-emerald-600">
                           {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-red-500">
                           {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-[#162839]">
                           ${Math.abs(entry.balance).toLocaleString()}
                           <span className="ml-1 text-[10px] text-neutral-400">{entry.balance > 0 ? 'DR' : 'CR'}</span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
