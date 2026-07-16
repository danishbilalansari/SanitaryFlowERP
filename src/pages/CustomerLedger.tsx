import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Printer } from 'lucide-react';

export default function CustomerLedger() {
  const { currency } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, ledgeRes] = await Promise.all([
          fetch(`/api/customers/${id}`),
          fetch(`/api/ledger?customer_id=${id}`)
        ]);
        const cust = await custRes.json();
        const ledge = await ledgeRes.json();
        setCustomer(cust);
        
        // Sort and calculate running balance
        let balance = 0;
        const sortedLedger = ledge
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((entry: any) => {
            balance += (entry.debit || 0) - (entry.credit || 0);
            return { ...entry, running_balance: balance };
          });
        
        setLedgerEntries(sortedLedger.reverse()); // Show latest first but balanced correctly
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-neutral-500 font-bold animate-pulse">Loading Ledger...</div>;
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
    <div className="space-y-6 max-w-5xl print:max-w-none mx-auto pb-20 print:pb-0">
      <div className="flex items-center justify-between z-10 relative">
        <div className="flex items-center space-x-4 print:w-full">
          <Link to={`/customers/${id}`} className="print:hidden p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors bg-white shadow-sm border border-neutral-200/60">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="print:flex print:items-center print:justify-between print:w-full">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 print:text-xl">{customer.name}</h1>
            <p className="text-[13px] text-neutral-500 mt-1 print:mt-0 print:text-[11px]">{customer.city} • {customer.phone}</p>
          </div>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="print:hidden flex items-center text-[13px] font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200/80 px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Statement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 print:flex print:flex-row print:justify-between gap-4 print:gap-2">
        <div className="print:flex-1 bg-white rounded-2xl p-6 print:p-3 border border-neutral-200/60 shadow-sm flex flex-col justify-center">
          <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500 mb-1">Statement Balance</p>
          <p className={`text-3xl print:text-xl print:text-lg font-bold tracking-tight ${currentBalance > 0 ? 'text-emerald-500' : currentBalance < 0 ? 'text-red-500' : 'text-neutral-900'}`}>
            {formatCurrency(Math.abs(currentBalance), currency)}
            <span className="text-sm font-medium ml-2 text-neutral-500">
              {currentBalance > 0 ? 'Recv' : currentBalance < 0 ? 'Credit' : ''}
            </span>
          </p>
        </div>
        <div className="print:flex-1 bg-white rounded-2xl p-6 print:p-3 border border-neutral-200/60 shadow-sm flex flex-col justify-center">
          <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500 mb-1">Total Transactions</p>
          <p className="text-3xl print:text-xl print:text-lg font-bold tracking-tight text-neutral-900">
            {ledgerEntries.length}
          </p>
        </div>
        <div className="print:flex-1 bg-white rounded-2xl p-6 print:p-3 border border-neutral-200/60 shadow-sm flex flex-col justify-center">
          <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500 mb-1">Customer Type</p>
          <p className="text-xl print:text-lg font-bold tracking-tight text-[#006397] mt-1">
            {customer.business_type}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden print:overflow-visible">
        <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <h2 className="text-[15px] font-bold tracking-tight text-neutral-900">Statement of Account</h2>
        </div>
        
        {ledgerEntries.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-500 text-[13px] font-medium">No ledger entries found for this customer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-[13px] whitespace-nowrap print:whitespace-normal print:table-fixed print:text-[11px]">
              <thead className="bg-[#f8f9fa] border-b border-neutral-100">
                <tr>
                  <th className="w-[15%] px-6 py-3 print:px-2 print:py-2 font-bold text-neutral-500 uppercase tracking-widest text-[10px]">Date</th>
                  <th className="w-[40%] px-6 py-3 print:px-2 print:py-2 font-bold text-neutral-500 uppercase tracking-widest text-[10px]">Description</th>
                  <th className="w-[15%] px-6 py-3 print:px-2 print:py-2 font-bold text-neutral-500 uppercase tracking-widest text-[10px] text-right">Debit / Out</th>
                  <th className="w-[15%] px-6 py-3 print:px-2 print:py-2 font-bold text-neutral-500 uppercase tracking-widest text-[10px] text-right">Credit / In</th>
                  <th className="w-[15%] px-6 py-3 print:px-2 print:py-2 font-bold text-neutral-500 uppercase tracking-widest text-[10px] text-right bg-neutral-50/50">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {ledgerEntries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
