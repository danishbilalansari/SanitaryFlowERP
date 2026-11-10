import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, FileText, ArrowLeft, ChevronRight } from 'lucide-react';
import { DashboardSkeleton } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache } from '../lib/apiCache';

export default function InvoiceView() {
  const { 
    currency, 
    logoUrl, 
    companyName, 
    companyAddress, 
    companyEmail, 
    companyPhone 
  } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const cachedSale = id ? peekApiCache<any>(`/api/sales/${id}`, 60_000) : undefined;
  const [sale, setSale] = useState<any>(() => cachedSale && !cachedSale.error ? cachedSale : null);
  const [loading, setLoading] = useState<boolean>(() => !(cachedSale && !cachedSale.error));
  
  useEffect(() => {
    if (!id) return;
    cachedJsonFetch<any>(`/api/sales/${id}`, { credentials: 'include' }, 60_000)
      .then(data => {
        if (data && !data.error) setSale(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
     return <DashboardSkeleton />;
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-neutral-500">
        <h2 className="text-2xl font-bold text-[#162839] mb-2">Invoice Not Found</h2>
        <p className="mb-8 max-w-sm text-neutral-400">The invoice record you're looking for doesn't exist.</p>
        <Link to="/sales" className="px-7 py-3 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold shadow-[0_6px_20px_rgba(2,132,199,0.28)] hover:opacity-95 transition-all">Back to Sales</Link>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="w-full">
        <div className="no-print flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/sales" 
              className="glass-pill-button w-11 h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all"
              title="Back to Sales"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <nav className="flex items-center gap-2 text-[13px] text-neutral-500 mb-1">
                <Link to="/sales" className="hover:text-secondary font-medium">Sales</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-on-surface font-semibold">Invoice {sale.order_number || `#${sale.id}`}</span>
              </nav>
              <h2 className="text-[28px] font-black text-primary tracking-tight">Invoice Details</h2>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="glass-pill-button flex items-center gap-2 px-6 py-2.5 text-slate-700 font-semibold text-[14px] rounded-full hover:bg-white/95 transition-all cursor-pointer" onClick={() => window.print()}>
              <Printer className="w-4 h-4 text-[#0284c7]" />
              Print Invoice
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 hover:from-[#0369a1] hover:to-sky-600 text-white font-semibold text-[14px] shadow-[0_6px_20px_rgba(2,132,199,0.28)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer">
              <FileText className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        <div className="print-area glass-card rounded-[30px] shadow-sm overflow-hidden flex flex-col p-8 mb-8 print:bg-white print:border-none print:shadow-none print:p-0">
          <div className="flex justify-between items-start bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white rounded-2xl shadow-sm">
            <div className="flex items-start gap-4">
              {logoUrl && (
                <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center shrink-0 shadow-sm border border-white">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-[26px] font-black tracking-tight leading-tight">{companyName}</h1>
                <div className="text-white/70 text-[13px] mt-2 space-y-1">
                  <p className="whitespace-pre-line leading-relaxed">{companyAddress}</p>
                  <p>{companyEmail} • {companyPhone}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-[20px] font-bold uppercase tracking-[0.2em] opacity-40 mb-3">Invoice</h2>
              <p className="text-[13px]">Invoice No: <span className="font-bold">{sale.order_number || `#${sale.id}`}</span></p>
              <p className="text-[13px]">Issue Date: <span className="font-bold">{sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'N/A'}</span></p>
            </div>
          </div>
          
          <div className="py-8 grid grid-cols-2 gap-12 border-b border-slate-200/60">
            <div>
              <h3 className="text-[11px] font-bold text-[#0284c7] mb-4 uppercase tracking-[0.14em]">Bill To</h3>
              <div className="text-slate-900">
                <p className="font-bold text-[17px] mb-1">{sale.customer_name || 'N/A'}</p>
                <div className="text-[13px] text-slate-600 leading-relaxed">
                  {sale.customer_address ? (
                    <p className="whitespace-pre-line">{sale.customer_address}</p>
                  ) : (
                    <p>{sale.customer_city || 'N/A'}</p>
                  )}
                </div>
                {sale.customer_phone && (
                  <p className="mt-4 text-[13px] font-bold text-slate-800">
                    <span className="text-slate-500 font-medium">Contact:</span> {sale.customer_phone}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-[#0284c7] mb-4 uppercase tracking-[0.14em]">Project / Ref</h3>
              <div className="bg-white/70 border border-white/90 rounded-2xl p-5 space-y-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500 font-semibold">Sales Type:</span>
                  <span className="text-slate-800 font-bold capitalize">General</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500 font-semibold">Reference ID:</span>
                  <span className="text-slate-800 font-bold">{sale.order_number || sale.id}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500 font-semibold">Status:</span>
                  <span className="text-slate-800 font-bold">{sale.status || 'Pending'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 py-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-[#162839] text-[12px] font-black uppercase text-[#162839]">
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5 text-center">Qty</th>
                  <th className="px-3 py-2.5 text-right">Unit Price</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sale.items?.map((item: any, idx: number) => {
                  return (
                    <tr key={idx} className="hover:bg-neutral-50/50">
                      <td className="px-3 py-4">
                        <p className="font-bold text-[#162839]">{item.product_name || 'Item'}</p>
                        <p className="text-[11px] text-neutral-400">{item.product_sku || ''}</p>
                      </td>
                      <td className="px-3 py-4 text-center text-[13px]">{item.qty || 0}</td>
                      <td className="px-3 py-4 text-right text-[13px]">{formatCurrency(((item.price || 0) as number), currency)}</td>
                      <td className="px-3 py-4 text-right font-black text-[13px] text-[#162839]">{formatCurrency(((item.qty * (item.price || 0)) as number), currency)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-6 flex justify-end border-t border-neutral-200">
            <div className="w-full md:w-1/3 space-y-3">
                {sale.discount > 0 && (
                  <div className="flex justify-between items-center py-1">
                      <span className="text-[14px] font-medium text-neutral-500">Discount:</span>
                      <span className="text-[14px] font-bold text-red-500">-{formatCurrency((sale.discount || 0), currency)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-t border-neutral-100 mt-2">
                    <span className="text-[18px] font-bold text-primary">Grand Total:</span>
                    <span className="text-[22px] font-black text-[#006397]">{formatCurrency(((sale.total || sale.total_amount || 0) as number), currency)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-neutral-100 mt-2">
                    <span className="text-[15px] font-bold text-neutral-500">Paid Amount:</span>
                    <span className="text-[18px] font-bold text-emerald-600">{formatCurrency(((sale.paid_amount || 0) as number), currency)}</span>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
