import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../store';
import { Printer, FileText, ArrowLeft, ChevronRight } from 'lucide-react';

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const { sales, customers, inventory } = useAppContext();
  
  const sale = sales.find(s => {
    console.log('Comparing', s.id.toString(), 'with', id);
    return s.id.toString() === id;
  });

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-neutral-500">
        <h2 className="text-2xl font-bold text-[#162839] mb-2">Invoice Not Found</h2>
        <p className="mb-8 max-w-sm text-neutral-400">The invoice record you're looking for doesn't exist.</p>
        <Link to="/sales" className="px-8 py-3 bg-[#006397] text-white font-bold rounded-xl shadow-lg hover:opacity-90">Back to Sales</Link>
      </div>
    );
  }

  const customer = customers.find(c => c.id === sale.customerId) || { name: 'N/A', address: 'N/A' };

  return (
    <div className="pt-8 pb-12">
      <div className="max-w-5xl mx-auto px-gutter">
        <div className="no-print flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/sales" 
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500"
              title="Back to Sales"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <nav className="flex items-center gap-2 text-[13px] text-neutral-500 mb-1">
                <Link to="/sales" className="hover:text-secondary font-medium">Sales</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-on-surface font-semibold">Invoice #{sale.id}</span>
              </nav>
              <h2 className="text-[28px] font-black text-primary tracking-tight">Invoice Details</h2>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#edeeef] text-primary font-semibold rounded-lg hover:bg-neutral-50 transition-colors" onClick={() => window.print()}>
              <Printer className="w-5 h-5" />
              Print Invoice
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#006397] text-white font-semibold rounded-lg shadow-sm hover:brightness-110 transition-all">
              <FileText className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>

        <div className="print-area bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden flex flex-col p-8 mb-8">
          <div className="flex justify-between items-start bg-gradient-to-r from-[#162839] to-[#2c3e50] p-8 text-white rounded-xl">
            <div>
              <h1 className="text-[26px] font-black tracking-tight">SanitaryFlow</h1>
              <p className="text-white/70 text-[13px] mt-2">
                12 Industrial Park, Sector 4<br/>
                Administrative Block, HQ-500021<br/>
                contact@sanitaryflow.erp
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-[20px] font-bold uppercase tracking-[0.2em] opacity-40 mb-3">Invoice</h2>
              <p className="text-[13px]">Invoice No: <span className="font-bold">#{sale.id}</span></p>
              <p className="text-[13px]">Issue Date: <span className="font-bold">{sale.date || 'Oct 24, 2024'}</span></p>
            </div>
          </div>
          
          <div className="py-8 grid grid-cols-2 gap-12 border-b border-outline-variant/30">
            <div>
              <h3 className="text-[11px] font-bold text-[#006397] mb-4 uppercase tracking-[0.1em]">Bill To</h3>
              <div className="text-on-surface">
                <p className="font-extrabold text-[17px] mb-1">{customer.name}</p>
                <div className="text-[13px] text-neutral-600 leading-relaxed">
                  {customer.address ? (
                    <p className="whitespace-pre-line">{customer.address}</p>
                  ) : (
                    <p>{customer.city || 'N/A'}</p>
                  )}
                </div>
                {customer.contact && (
                  <p className="mt-4 text-[13px] font-bold text-neutral-800">
                    <span className="text-neutral-500 font-medium">Attn:</span> {customer.contact}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-[#006397] mb-4 uppercase tracking-[0.1em]">Project / Ref</h3>
              <div className="bg-[#f8f9fa] border border-[#edeeef] rounded-lg p-5 space-y-2.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-neutral-500 font-semibold">Sales Type:</span>
                  <span className="text-neutral-800 font-bold capitalize">{sale.type || 'General'}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-neutral-500 font-semibold">Reference ID:</span>
                  <span className="text-neutral-800 font-bold">{sale.id}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-neutral-500 font-semibold">Status:</span>
                  <span className="text-neutral-800 font-bold">{sale.status || 'Pending'}</span>
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
                  const product = inventory.find(p => p.id === item.product_id || p.id === item.itemId);
                  return (
                    <tr key={idx} className="hover:bg-neutral-50/50">
                      <td className="px-3 py-4">
                        <p className="font-bold text-[#162839]">{product?.name || 'Item'}</p>
                        <p className="text-[11px] text-neutral-400">{product?.code || ''}</p>
                      </td>
                      <td className="px-3 py-4 text-center text-[13px]">{item.qty || 0}</td>
                      <td className="px-3 py-4 text-right text-[13px]">${((item.price || 0) as number).toLocaleString()}</td>
                      <td className="px-3 py-4 text-right font-black text-[13px] text-[#162839]">${((item.qty * (item.price || 0)) as number).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-6 flex justify-end border-t border-neutral-200">
            <div className="w-full md:w-1/3 space-y-3">
                <div className="flex justify-between text-neutral-500 text-[14px]">
                  <span>Subtotal:</span>
                  <span className="font-bold text-neutral-800">${(sale.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-error text-[14px]">
                  <span>Discount:</span>
                  <span className="font-bold">-${(sale.discount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-neutral-100 mt-2">
                    <span className="text-[18px] font-bold text-primary">Grand Total:</span>
                    <span className="text-[22px] font-black text-[#006397]">${((sale.total || sale.total_amount || 0) as number).toLocaleString()}</span>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
