import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, ArrowUpRight, ArrowDownLeft, DollarSign, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassPagination } from '../components/GlassUI';

export default function Accounts() {
  const { currency } = useAppContext();
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetch('/api/ledger')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => {
        setLedger(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Ledger fetch err:', err);
        setLoading(false);
      });
  }, []);

  const filteredLedger = React.useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return ledger;
    return ledger.filter(item => 
      (item.description || '').toLowerCase().includes(s) ||
      (item.reference_id || '').toLowerCase().includes(s) ||
      (item.account_type || '').toLowerCase().includes(s)
    );
  }, [ledger, search]);

  const totalCredits = React.useMemo(() => {
    return ledger.reduce((acc, curr) => acc + (curr.credit || 0), 0);
  }, [ledger]);

  const totalDebits = React.useMemo(() => {
    return ledger.reduce((acc, curr) => acc + (curr.debit || 0), 0);
  }, [ledger]);

  const balance = React.useMemo(() => {
    return totalCredits - totalDebits;
  }, [totalCredits, totalDebits]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/" className="hover:text-[#0284c7] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0284c7] font-bold">Accounts & Ledger</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">Accounts & Ledger</h2>
          <p className="text-sm text-slate-600">Financial tracking and general ledger transaction history.</p>
        </div>
        <div className="flex gap-2.5">
          <Link to="/accounts/add" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white text-xs font-semibold hover:brightness-105 transition-all shadow-[0_4px_16px_rgba(2,132,199,0.3)]">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Entry</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
         <div className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
               <div className="w-11 h-11 bg-emerald-50 border border-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-2xs"><ArrowDownLeft className="w-5 h-5"/></div>
               <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 px-3 py-0.5 rounded-full">Income</span>
            </div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.08em]">Total Credits</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">{formatCurrency(totalCredits, currency)}</h3>
         </div>
         <div className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
               <div className="w-11 h-11 bg-rose-50 border border-white text-rose-600 rounded-2xl flex items-center justify-center shadow-2xs"><ArrowUpRight className="w-5 h-5"/></div>
               <span className="text-[11px] font-semibold text-rose-700 bg-rose-50/90 border border-rose-200/80 px-3 py-0.5 rounded-full">Expenses</span>
            </div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.08em]">Total Debits</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">{formatCurrency(totalDebits, currency)}</h3>
         </div>
         <div className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
               <div className="w-11 h-11 bg-sky-50 border border-white text-[#0284c7] rounded-2xl flex items-center justify-center shadow-2xs"><DollarSign className="w-5 h-5"/></div>
               <span className="text-[11px] font-semibold text-[#0284c7] bg-sky-50/90 border border-sky-200/80 px-3 py-0.5 rounded-full">Cash Flow</span>
            </div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.08em]">Net Balance</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">{formatCurrency(balance, currency)}</h3>
         </div>
      </div>

      <div className="glass-table-container">
        <div className="p-5 sm:p-6 border-b border-white/90 bg-white/[0.45] backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
             <h4 className="text-[17px] font-bold text-slate-900 tracking-tight">General Ledger</h4>
             <p className="text-xs text-slate-500 mt-0.5">Chronological record of credits and debits</p>
           </div>
           <div className="relative w-full md:w-80 group">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0284c7] transition-colors pointer-events-none z-10" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ledger by reference or account..." 
              className="w-full pl-11 pr-5 py-2.5 rounded-full text-[13px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead>
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Account Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Debit (-)</th>
                <th className="px-6 py-4 text-right">Credit (+)</th>
              </tr>
            </thead>
            <tbody className="text-[13.5px]">
               {filteredLedger
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((row) => (
                <tr key={row.id} className="group hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500 tabular-nums">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 font-mono text-xs">
                    {row.reference_id}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-white/90 text-slate-700 text-[11px] font-semibold rounded-full border border-white shadow-2xs">
                      {row.account_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13.5px] text-slate-600 font-medium leading-tight max-w-xs truncate">
                    {row.description}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {row.debit > 0 && <span className="font-extrabold text-rose-500">-{formatCurrency(row.debit, currency)}</span>}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {row.credit > 0 && <span className="font-extrabold text-emerald-600">+{formatCurrency(row.credit, currency)}</span>}
                  </td>
                </tr>
              ))}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    No financial records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <GlassPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredLedger.length / itemsPerPage)}
          totalItems={filteredLedger.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="entries"
        />
      </div>
    </div>
  );
}
