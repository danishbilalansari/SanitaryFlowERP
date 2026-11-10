import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Printer, Trash2, Edit2, X, Check } from 'lucide-react';
import { GlassDatePicker, GlassPagination, DashboardSkeleton } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

function computeRunningLedger(ledge: any[]) {
  let balance = 0;
  return [...ledge]
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((entry: any) => {
      balance += (entry.debit || 0) - (entry.credit || 0);
      return { ...entry, running_balance: balance };
    })
    .reverse();
}

export default function CustomerLedger() {
  const { currency, showToast } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const cachedCust = id ? peekApiCache<any>(`/api/customers/${id}`, 60_000) : undefined;
  const cachedLedge = id ? peekApiCache<any[]>(`/api/ledger?customer_id=${id}`, 60_000) : undefined;
  const [customer, setCustomer] = useState<any>(() => cachedCust ?? null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>(() =>
    Array.isArray(cachedLedge) ? computeRunningLedger(cachedLedge) : []
  );
  const [loading, setLoading] = useState<boolean>(() => !(cachedCust && Array.isArray(cachedLedge)));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editForm, setEditForm] = useState({ description: '', debit: '', credit: '', reference_id: '', created_at: '' });

  const fetchData = async (forceRefresh = false) => {
    if (!id) return;
    if (forceRefresh) {
      invalidateApiCache(`/api/customers/${id}`);
      invalidateApiCache(`/api/ledger?customer_id=${id}`);
      invalidateApiCache('/api/customers');
      invalidateApiCache('/api/reports/customer-summary-city-wise');
    }
    try {
      const [cust, ledge] = await Promise.all([
        cachedJsonFetch<any>(`/api/customers/${id}`, { credentials: 'include' }, 60_000),
        cachedJsonFetch<any[]>(`/api/ledger?customer_id=${id}`, { credentials: 'include' }, 60_000)
      ]);
      setCustomer(cust);
      setLedgerEntries(Array.isArray(ledge) ? computeRunningLedger(ledge) : []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
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

  if (loading) return <DashboardSkeleton />;
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-500">
        <p className="mb-4">Customer not found.</p>
        <Link to="/customers" className="text-[#006397] hover:underline">Return to Customers</Link>
      </div>
    );
  }

  const currentBalance = ledgerEntries.length > 0 ? ledgerEntries[0].running_balance : 0;

  return (
    <div className="space-y-6 pb-20 print:pb-0">
      <div className="flex items-center justify-between z-10 relative">
        <div className="flex items-center space-x-4 print:w-full">
          <Link to={`/customers/${id}`} className="print:hidden w-10 h-10 glass-pill-button rounded-full flex items-center justify-center text-slate-600 hover:text-[#0284c7] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="print:flex print:items-center print:justify-between print:w-full">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 print:text-xl">{customer.name}</h1>
            <p className="text-[13px] text-slate-500 mt-1 print:mt-0 print:text-[11px]">{customer.city} • {customer.phone}</p>
          </div>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="print:hidden flex items-center text-[13px] font-semibold text-slate-700 glass-pill-button px-5 py-2.5 rounded-full cursor-pointer"
        >
          <Printer className="w-4 h-4 mr-2 text-[#0284c7]" />
          Print Statement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 print:flex print:flex-row print:justify-between gap-6 print:gap-2">
        <div className="print:flex-1 glass-card p-6 sm:p-7 print:p-3 rounded-[28px] flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">Statement Balance</p>
          <p className={`text-[30px] print:text-xl font-bold tracking-tight ${currentBalance > 0 ? 'text-emerald-600' : currentBalance < 0 ? 'text-rose-500' : 'text-slate-900'}`}>
            {formatCurrency(Math.abs(currentBalance), currency)}
            <span className="text-sm font-medium ml-2 text-slate-400">
              {currentBalance > 0 ? 'Recv' : currentBalance < 0 ? 'Credit' : ''}
            </span>
          </p>
        </div>
        <div className="print:flex-1 glass-card p-6 sm:p-7 print:p-3 rounded-[28px] flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">Total Transactions</p>
          <p className="text-[30px] print:text-xl font-bold tracking-tight text-slate-900">
            {ledgerEntries.length}
          </p>
        </div>
        <div className="print:flex-1 glass-card p-6 sm:p-7 print:p-3 rounded-[28px] flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">Customer Type</p>
          <p className="text-[22px] print:text-lg font-bold tracking-tight text-[#0284c7] mt-1">
            {customer.business_type}
          </p>
        </div>
      </div>

      <div className="glass-table-container rounded-[30px] overflow-hidden print:overflow-visible">
        <div className="px-8 py-5 border-b border-slate-200/60 flex justify-between items-center bg-white/40 backdrop-blur-md">
          <h2 className="text-[17px] font-bold tracking-tight text-slate-900">Statement of Account</h2>
        </div>
        
        {ledgerEntries.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-[13.5px] font-medium">No ledger entries found for this customer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-[13.5px] whitespace-nowrap print:whitespace-normal print:table-fixed print:text-[11px]">
              <thead className="bg-slate-50/60 border-b border-slate-200/60">
                <tr>
                  <th className="w-[15%] px-7 py-3.5 print:px-2 print:py-2 font-bold text-slate-500 uppercase tracking-widest text-[11px]">Date</th>
                  <th className="w-[30%] px-7 py-3.5 print:px-2 print:py-2 font-bold text-slate-500 uppercase tracking-widest text-[11px]">Description</th>
                  <th className="w-[15%] px-7 py-3.5 print:px-2 print:py-2 font-bold text-slate-500 uppercase tracking-widest text-[11px] text-right">Debit / Out</th>
                  <th className="w-[15%] px-7 py-3.5 print:px-2 print:py-2 font-bold text-slate-500 uppercase tracking-widest text-[11px] text-right">Credit / In</th>
                  <th className="w-[15%] px-7 py-3.5 print:px-2 print:py-2 font-bold text-slate-500 uppercase tracking-widest text-[11px] text-right bg-slate-50/40">Balance</th>
                  <th className="w-[10%] px-7 py-3.5 font-bold text-slate-500 uppercase tracking-widest text-[11px] text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {ledgerEntries
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((entry, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                    {editingEntry === entry.id ? (
                      <>
                        <td className="px-6 py-4 align-top">
                          <GlassDatePicker className="w-full min-w-[150px]" value={editForm.created_at} onChange={e => setEditForm({...editForm, created_at: e.target.value})} />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <input type="text" placeholder="Ref ID" className="w-full min-w-[150px] p-2 border border-neutral-200 rounded mb-2 text-[13px] block" value={editForm.reference_id} onChange={e => setEditForm({...editForm, reference_id: e.target.value})} />
                          <input type="text" placeholder="Description" className="w-full min-w-[150px] p-2 border border-neutral-200 rounded text-[13px] block" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <input type="number" placeholder="Debit" className="w-full min-w-[100px] p-2 border border-neutral-200 rounded text-right text-[13px]" value={editForm.debit} onChange={e => setEditForm({...editForm, debit: e.target.value})} />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <input type="number" placeholder="Credit" className="w-full min-w-[100px] p-2 border border-neutral-200 rounded text-right text-[13px]" value={editForm.credit} onChange={e => setEditForm({...editForm, credit: e.target.value})} />
                        </td>
                        <td className="px-6 py-4 text-right bg-neutral-50/50 text-neutral-400 align-top">-</td>
                        <td className="px-6 py-4 text-right print:hidden align-top">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleEditSave(entry.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Save"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingEntry(null)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Cancel"><X className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 print:px-2 print:py-2 text-neutral-500">{new Date(entry.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 print:px-2 print:py-2">
                           <span className="font-bold text-[#162839] tracking-tight block print:whitespace-normal print:break-all">{entry.reference_id}</span>
                           <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[10px] font-bold text-neutral-400 border border-neutral-200 px-1.5 rounded print:hidden">{entry.account_type}</span>
                             <span className="text-[11px] text-neutral-400 truncate max-w-[200px] print:max-w-none print:whitespace-normal print:break-words">{entry.description}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-2 text-right font-bold text-emerald-600">
                          {entry.debit > 0 ? formatCurrency(entry.debit, currency) : '-'}
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-2 text-right font-bold text-red-500">
                          {entry.credit > 0 ? formatCurrency(entry.credit, currency) : '-'}
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-2 text-right font-bold text-neutral-900 bg-neutral-50/50">
                          {formatCurrency(entry.running_balance, currency)}
                        </td>
                        <td className="px-6 py-4 text-right print:hidden">
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
        )}
        <GlassPagination
          currentPage={currentPage}
          totalPages={Math.ceil(ledgerEntries.length / itemsPerPage)}
          totalItems={ledgerEntries.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="entries"
        />
      </div>
    </div>
  );
}
