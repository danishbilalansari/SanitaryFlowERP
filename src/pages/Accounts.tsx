import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, ArrowUpRight, ArrowDownLeft, DollarSign, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Accounts() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredLedger = ledger.filter(item => 
    item.description?.toLowerCase().includes(search.toLowerCase()) ||
    item.reference_id?.toLowerCase().includes(search.toLowerCase()) ||
    item.account_type?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCredits = ledger.reduce((acc, curr) => acc + (curr.credit || 0), 0);
  const totalDebits = ledger.reduce((acc, curr) => acc + (curr.debit || 0), 0);
  const balance = totalCredits - totalDebits;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Accounts & Ledger</span>
          </nav>
          <h2 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">Accounts & Ledger</h2>
          <p className="text-[16px] text-neutral-500 mt-1">Financial tracking and transaction history</p>
        </div>
        <div className="flex gap-3">
          <Link to="/accounts/add" className="flex items-center gap-2 px-5 py-2 bg-[#162839] text-white text-[13px] font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg">
            <Plus className="w-4 h-4" />
            New Entry
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white border border-[#edeeef] p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowDownLeft className="w-6 h-6"/></div>
               <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Income</span>
            </div>
            <p className="text-neutral-400 text-[11px] font-black uppercase tracking-widest">Total Credits</p>
            <h3 className="text-[28px] font-black text-[#162839]">${totalCredits.toLocaleString()}</h3>
         </div>
         <div className="bg-white border border-[#edeeef] p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-red-50 text-red-600 rounded-xl"><ArrowUpRight className="w-6 h-6"/></div>
               <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase">Expenses</span>
            </div>
            <p className="text-neutral-400 text-[11px] font-black uppercase tracking-widest">Total Debits</p>
            <h3 className="text-[28px] font-black text-[#162839]">${totalDebits.toLocaleString()}</h3>
         </div>
         <div className="bg-[#162839] p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-white/10 text-[#5cb8fd] rounded-xl"><DollarSign className="w-6 h-6"/></div>
               <span className="text-[10px] font-black text-[#5cb8fd] bg-white/10 px-2 py-0.5 rounded uppercase">Cash Flow</span>
            </div>
            <p className="text-white/40 text-[11px] font-black uppercase tracking-widest">Net Balance</p>
            <h3 className="text-[28px] font-black text-white">${balance.toLocaleString()}</h3>
         </div>
      </div>

      <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#edeeef] flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ledger by reference or account..." 
              className="w-full pl-11 pr-4 py-3 bg-[#f3f4f5] border-none rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-[#f3f4f5] border-b border-[#edeeef]">
              <tr className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Reference</th>
                <th className="px-8 py-5">Account Type</th>
                <th className="px-8 py-5">Description</th>
                <th className="px-8 py-5 text-right">Debit (-)</th>
                <th className="px-8 py-5 text-right">Credit (+)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
               {filteredLedger.map((row) => (
                <tr key={row.id} className="hover:bg-[#f8f9fa] transition-colors group">
                  <td className="px-8 py-5 text-[13px] font-bold text-neutral-500">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 font-black text-[#162839] uppercase text-[12px] tracking-wider">
                    {row.reference_id}
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-neutral-100 text-[#162839] text-[11px] font-bold rounded-lg border border-neutral-200 uppercase tracking-tighter">
                      {row.account_type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-[14px] text-neutral-600 font-medium leading-tight max-w-xs truncate">
                    {row.description}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {row.debit > 0 && <span className="font-black text-red-500">-${row.debit.toLocaleString()}</span>}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {row.credit > 0 && <span className="font-black text-emerald-500">+${row.credit.toLocaleString()}</span>}
                  </td>
                </tr>
              ))}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-neutral-400 italic">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    No financial records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
