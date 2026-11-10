import { formatCurrency } from '../lib/currency';
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
  Plus,
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useAppContext } from '../store';
import { GlassDatePicker, GlassPagination, GlassModal, DashboardSkeleton } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

export default function SupplierLedger() {
  const { id } = useParams();
  const { showToast, currency } = useAppContext();
  const cachedSuppliers = peekApiCache<any[]>('/api/suppliers', 60_000);
  const cachedLedger = id ? peekApiCache<any[]>(`/api/ledger?supplier_id=${id}`, 60_000) : undefined;
  const [supplier, setSupplier] = useState<any>(() =>
    Array.isArray(cachedSuppliers) ? cachedSuppliers.find((s: any) => s.id === Number(id)) ?? null : null
  );
  const [ledger, setLedger] = useState<any[]>(() => Array.isArray(cachedLedger) ? cachedLedger : []);
  const [loading, setLoading] = useState<boolean>(() => !(Array.isArray(cachedSuppliers) && Array.isArray(cachedLedger)));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editForm, setEditForm] = useState({ description: '', debit: '', credit: '', reference_id: '', created_at: '' });

  const fetchData = async (forceRefresh = false) => {
    if (!id) return;
    if (forceRefresh) {
      invalidateApiCache('/api/suppliers');
      invalidateApiCache(`/api/ledger?supplier_id=${id}`);
      invalidateApiCache('/api/ledger');
    }
    try {
      const [suppliers, ledgerData] = await Promise.all([
        cachedJsonFetch<any[]>('/api/suppliers', { credentials: 'include' }, 60_000),
        cachedJsonFetch<any[]>(`/api/ledger?supplier_id=${id}`, { credentials: 'include' }, 60_000)
      ]);
      
      const currentSupplier = Array.isArray(suppliers) ? suppliers.find((s: any) => s.id === Number(id)) : null;
      setSupplier(currentSupplier);
      setLedger(Array.isArray(ledgerData) ? ledgerData : []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      showToast?.('Error fetching ledger data', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async (entryId: string) => {
    
    try {
      const res = await fetch(`/api/ledger/${entryId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast?.('Transaction deleted', 'success');
        fetchData(true);
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      showToast?.('Failed to delete transaction', 'error');
    }
  };

  const handleEditClick = (entry: any) => {
    setEditingEntry(entry.id);
    setEditForm({
      description: entry.description || '',
      debit: entry.debit || '',
      credit: entry.credit || '',
      reference_id: entry.reference_id || '',
      created_at: new Date(entry.created_at).toISOString().split('T')[0]
    });
  };

  const handleEditSave = async (entryId: string) => {
    try {
      const res = await fetch(`/api/ledger/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editForm.description,
          debit: parseFloat(editForm.debit) || 0,
          credit: parseFloat(editForm.credit) || 0,
          reference_id: editForm.reference_id,
          created_at: new Date(editForm.created_at).toISOString()
        })
      });
      if (res.ok) {
        showToast?.('Transaction updated', 'success');
        setEditingEntry(null);
        fetchData(true);
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      showToast?.('Failed to update transaction', 'error');
    }
  };

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
        fetchData(true);
      } else {
        throw new Error('Payment failed');
      }
    } catch (err) {
      showToast('Failed to record payment', 'error');
    }
  };

  if (loading) return <DashboardSkeleton />;
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
          <nav className="print:hidden flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/suppliers" className="hover:text-[#006397] transition-colors">Suppliers</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Ledger</span>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/suppliers" className="print:hidden p-2 hover:bg-neutral-100 rounded-full text-neutral-400 transition-all">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-[32px] print:text-xl font-black text-[#001d31] tracking-tight leading-none">{supplier.name}</h2>
              <p className="text-[16px] text-neutral-500 mt-1">Transaction history and balance tracking.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="print:hidden flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 font-bold rounded-lg hover:bg-neutral-50 transition-all text-[14px]">
            <Printer className="w-4 h-4" />
            Print Statement
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 print:flex print:flex-row print:justify-between gap-6 print:gap-4">
         <div className="print:flex-1 glass-card p-6 sm:p-7 print:p-3 rounded-[28px]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-3">Current Balance</p>
            <h3 className={`text-[30px] print:text-xl font-bold tracking-tight leading-none ${currentBalance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
               {formatCurrency(Math.abs(currentBalance), currency)}
            </h3>
            <p className="mt-3 text-[12px] font-medium text-slate-500">
               {currentBalance > 0 ? 'Amount Payable' : 'Credit Balance'}
            </p>
         </div>

         <div className="print:flex-1 glass-card p-6 sm:p-7 print:p-3 rounded-[28px]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-3">Total Purchases</p>
            <h3 className="text-[30px] print:text-xl font-bold text-slate-900 tracking-tight leading-none">{formatCurrency(totalCredit, currency)}</h3>
            <div className="mt-3 flex items-center gap-1.5 text-emerald-600 text-[12.5px] font-semibold">
               <TrendingUp className="w-4 h-4" />
               <span>Lifetime supply</span>
            </div>
         </div>

         <div className="print:flex-1 glass-card p-6 sm:p-7 print:p-3 rounded-[28px]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-3">Total Paid</p>
            <h3 className="text-[30px] print:text-xl font-bold text-slate-900 tracking-tight leading-none">{formatCurrency(totalDebit, currency)}</h3>
            <div className="mt-3 flex items-center gap-1.5 text-[#0284c7] text-[12.5px] font-semibold">
               <Wallet className="w-4 h-4" />
               <span>Settled invoices</span>
            </div>
         </div>

         <div className="print:hidden glass-card p-6 sm:p-7 print:p-3 rounded-[28px] flex items-center justify-center">
             <button onClick={() => setShowPaymentModal(true)} className="flex flex-col items-center gap-2.5 text-slate-800 hover:text-[#0284c7] group cursor-pointer transition-colors">
                <div className="w-12 h-12 bg-white/95 border border-white rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all shadow-[0_4px_14px_rgba(15,23,42,0.06)] text-[#0284c7]">
                   <Plus className="w-6 h-6" />
                </div>
                <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#0284c7]">Post Payment</span>
             </button>
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
             <span className="text-[13px] font-semibold text-slate-800">Record Supplier Payment</span>
           </div>
           <button
             type="button"
             onClick={() => setShowPaymentModal(false)}
             className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
           >
             <X className="w-4 h-4" />
           </button>
        </div>
        <form onSubmit={handlePostPayment} className="space-y-4">
           <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] block">AMOUNT TO PAY ({currency})</label>
              <input 
                required
                type="number" 
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3.5 text-[18px] font-bold text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40"
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] block">DESCRIPTION (OPTIONAL)</label>
              <textarea 
                value={paymentDesc}
                onChange={e => setPaymentDesc(e.target.value)}
                placeholder="Cheque #, Bank Transfer Ref..."
                className="w-full rounded-2xl bg-white/90 border border-white p-4 text-[14px] text-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 resize-none"
                rows={3}
              />
           </div>
           <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-2.5 rounded-full bg-white/90 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)] flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#0284c7] stroke-[2.5]" />
                <span>Save Changes</span>
              </button>
           </div>
        </form>
      </GlassModal>

      {/* Ledger Table */}
      <div className="glass-table-container rounded-[30px] overflow-hidden print:overflow-visible">
         <div className="px-8 py-5 border-b border-slate-200/60 flex justify-between items-center bg-white/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                  <CalendarDays className="w-5 h-5 text-[#0284c7]" />
               </div>
               <div>
                  <h3 className="font-bold text-slate-900 text-[18px] tracking-tight">All Transactions</h3>
                  <p className="text-[12px] text-slate-500 font-medium">Historical audit of purchases, debits, and credit ledger</p>
               </div>
            </div>
            <div className="print:hidden flex gap-4">
               <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search entries..." className="rounded-full bg-white/90 border border-white pl-10 pr-4 py-2 text-[13px] text-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40" />
               </div>
            </div>
         </div>
         <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left print:whitespace-normal print:table-fixed print:text-[11px]">
               <thead>
                  <tr className="bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200/60">
                     <th className="w-[12%] px-8 py-4 print:px-2 print:py-2">Date</th>
                     <th className="w-[20%] px-8 py-4 print:px-2 print:py-2">Description</th>
                     <th className="w-[15%] px-8 py-4 print:px-2 print:py-2">Reference</th>
                     <th className="w-[15%] px-8 py-4 print:px-2 print:py-2 text-right">Debit (Paid)</th>
                     <th className="w-[15%] px-8 py-4 print:px-2 print:py-2 text-right">Credit (Purchased)</th>
                     <th className="w-[15%] px-8 py-4 print:px-2 print:py-2 text-right">Running Balance</th>
                     <th className="w-[8%] px-8 py-4 text-right print:hidden">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100/80 text-[14px]">
                  {ledgerWithBalance
                     .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                     .map((entry, idx) => (
                     <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                        {editingEntry === entry.id ? (
                           <>
                              <td className="px-8 py-5 align-top">
                                 <GlassDatePicker className="w-full min-w-[150px]" value={editForm.created_at} onChange={e => setEditForm({...editForm, created_at: e.target.value})} />
                              </td>
                              <td className="px-8 py-5 align-top">
                                 <input type="text" placeholder="Description" className="w-full min-w-[150px] p-2 border border-neutral-200 rounded text-[13px]" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                              </td>
                              <td className="px-8 py-5 align-top">
                                 <input type="text" placeholder="Ref ID" className="w-full min-w-[120px] p-2 border border-neutral-200 rounded text-[13px]" value={editForm.reference_id} onChange={e => setEditForm({...editForm, reference_id: e.target.value})} />
                              </td>
                              <td className="px-8 py-5 align-top">
                                 <input type="number" placeholder="Debit" className="w-full min-w-[100px] p-2 border border-neutral-200 rounded text-right text-[13px]" value={editForm.debit} onChange={e => setEditForm({...editForm, debit: e.target.value})} />
                              </td>
                              <td className="px-8 py-5 align-top">
                                 <input type="number" placeholder="Credit" className="w-full min-w-[100px] p-2 border border-neutral-200 rounded text-right text-[13px]" value={editForm.credit} onChange={e => setEditForm({...editForm, credit: e.target.value})} />
                              </td>
                              <td className="px-8 py-5 text-right font-black text-[#162839] align-top">-</td>
                              <td className="px-8 py-5 text-right print:hidden align-top">
                                 <div className="flex gap-2 justify-end">
                                    <button onClick={() => handleEditSave(entry.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Save"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingEntry(null)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Cancel"><X className="w-4 h-4" /></button>
                                 </div>
                              </td>
                           </>
                        ) : (
                           <>
                              <td className="px-8 py-5 print:px-2 print:py-2 text-[#162839] font-medium">
                                 {new Date(entry.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-8 py-5 print:px-2 print:py-2">
                                 <p className="font-bold text-[#162839]">{entry.description}</p>
                                 <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-tight">{entry.account_type}</p>
                              </td>
                              <td className="px-8 py-5 print:px-2 print:py-2">
                                 <span className="bg-neutral-100 text-neutral-600 px-3 py-1 rounded text-[12px] font-bold inline-block print:whitespace-normal print:break-all">
                                    {entry.reference_id}
                                 </span>
                              </td>
                              <td className="px-8 py-5 print:px-2 print:py-2 text-right font-black text-emerald-600">
                                 {entry.debit > 0 ? `${formatCurrency(entry.debit, currency)}` : '-'}
                              </td>
                              <td className="px-8 py-5 print:px-2 print:py-2 text-right font-black text-red-500">
                                 {entry.credit > 0 ? `${formatCurrency(entry.credit, currency)}` : '-'}
                              </td>
                              <td className="px-8 py-5 print:px-2 print:py-2 text-right font-black text-[#162839]">
                                 {formatCurrency(Math.abs(entry.balance), currency)}
                                 <span className="ml-1 text-[10px] text-neutral-400">{entry.balance > 0 ? 'DR' : 'CR'}</span>
                              </td>
                              <td className="px-8 py-5 text-right print:hidden">
                                 <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => handleEditClick(entry)} className="p-2 text-neutral-400 hover:text-[#006397] hover:bg-neutral-100 rounded-lg transition-colors" title="Edit">
                                       <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(entry.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              </td>
                           </>
                        )}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         <GlassPagination
            currentPage={currentPage}
            totalPages={Math.ceil(ledgerWithBalance.length / itemsPerPage)}
            totalItems={ledgerWithBalance.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="entries"
         />
      </div>
    </div>
  );
}
