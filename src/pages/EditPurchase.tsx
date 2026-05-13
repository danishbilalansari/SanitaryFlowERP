import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronRight, 
  Truck, 
  Calendar, 
  PlusCircle, 
  Trash2, 
  Info, 
  RotateCcw, 
  CheckCircle,
  HelpCircle,
  Bell,
  Search,
  User,
  History,
  Key,
  Trash
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../store';

export default function EditPurchase() {
  const { id } = useParams();
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  const [items, setItems] = useState([
    { id: 1, name: 'Premium Porcelain Tile - Matte', sku: 'CR-2099-WH', qty: 450, price: 12.50 },
    { id: 2, name: 'Industrial Grade Adhesive', sku: 'AD-500-MAX', qty: 25, price: 84.00 },
    { id: 3, name: 'Steel Reinforcement Rods (10mm)', sku: 'ST-10-REBAR', qty: 100, price: 15.20 }
  ]);

  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Breadcrumbs & Status Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/purchases" className="hover:text-[#006397] transition-colors">Purchases</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-neutral-500">{id || 'PO-2023-0892'}</span>
          </nav>
          <h1 className="text-[32px] font-bold text-[#162839] tracking-tight leading-none">Edit Purchase Order</h1>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#cce5ff] text-[#001d31] rounded-full text-[11px] font-black tracking-widest border border-[#5cb8fd]/30 shadow-sm">
            <div className="p-0.5 bg-[#006397] rounded-full">
              <Info className="w-2.5 h-2.5 text-white fill-current" />
            </div>
            DRAFT STATUS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Supplier & Terms */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Supplier Card */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <h3 className="text-[18px] font-bold text-[#162839] mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#d3e4fe] text-[#006397] rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              Supplier Information
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Supplier Name</label>
                <div className="relative">
                  <select className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none appearance-none focus:ring-2 focus:ring-[#5cb8fd] transition-all">
                    <option>Ceramic Solutions Inc.</option>
                    <option>Global Pipes Ltd.</option>
                    <option>Industrial Fittings Co.</option>
                  </select>
                  <ChevronRight className="w-4 h-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Contact Person</label>
                <input 
                  type="text" 
                  defaultValue="Marco Verratti"
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>

              <div className="pt-2">
                <p className="text-[13px] text-neutral-500 leading-relaxed">
                  <span className="font-bold text-[#162839]">Address:</span> 442 Industrial Way, Suite 200,<br />
                  Columbus, OH 43215
                </p>
              </div>
            </div>
          </section>

          {/* Logistics Card */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <h3 className="text-[18px] font-bold text-[#162839] mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#d3e4fe] text-[#006397] rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              Logistics & Dates
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Expected Delivery</label>
                <input 
                  type="date" 
                  defaultValue="2023-11-24"
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Shipping Method</label>
                <div className="relative">
                  <select defaultValue="Expedited Ground (2-3 days)" className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-bold outline-none appearance-none focus:ring-2 focus:ring-[#5cb8fd] transition-all">
                    <option>Standard Freight (5-7 days)</option>
                    <option>Expedited Ground (2-3 days)</option>
                    <option>Next Day Air</option>
                  </select>
                  <ChevronRight className="w-4 h-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Order Items */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <section className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-[#edeeef] flex justify-between items-center bg-white">
              <h3 className="text-[20px] font-bold text-[#162839]">Order Items</h3>
              <button className="flex items-center gap-2 text-[#006397] font-bold text-[14px] hover:underline">
                <PlusCircle className="w-5 h-5" />
                Add New Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f8f9fa] border-b border-[#edeeef]">
                  <tr>
                    <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest">Item Description</th>
                    <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest w-32">Quantity</th>
                    <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest w-40">Unit Price</th>
                    <th className="px-8 py-4 text-[12px] font-bold text-neutral-500 uppercase tracking-widest text-right">Total</th>
                    <th className="px-8 py-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edeeef]">
                  {items.map((item) => (
                    <tr key={item.id} className="group hover:bg-[#f8f9fa]/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-[15px] font-bold text-[#162839]">{item.name}</p>
                        <p className="text-[12px] text-neutral-500 mt-1">SKU: {item.sku}</p>
                      </td>
                      <td className="px-8 py-6">
                        <input 
                          type="number" 
                          defaultValue={item.qty}
                          className="w-24 bg-white border border-[#c4c6cd] rounded-lg px-3 py-2 text-[14px] font-bold focus:ring-2 focus:ring-[#5cb8fd] outline-none"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 font-medium">$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            defaultValue={(item.price ?? 0).toFixed(2)}
                            className="w-28 bg-white border border-[#c4c6cd] rounded-lg px-3 py-2 text-[14px] font-bold focus:ring-2 focus:ring-[#5cb8fd] outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-[#162839] text-[15px]">
                        ${(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="p-2 text-neutral-400 hover:text-[#ba1a1a] transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-[#f8f9fa] border-t border-[#edeeef] flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-[14px] text-neutral-500">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-bold">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[14px] text-neutral-500 pb-3 border-b border-[#edeeef]">
                  <span className="font-medium">Tax (8%):</span>
                  <span className="font-bold">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-[20px] font-black text-[#162839]">Total:</span>
                  <span className="text-[24px] font-black text-[#162839] tracking-tight">
                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Remarks Card */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <h3 className="text-[18px] font-bold text-[#162839] mb-6">Special Instructions & Remarks</h3>
            <textarea 
              className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl p-4 text-[14px] font-medium text-neutral-600 outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all leading-relaxed"
              rows={4}
              defaultValue="Please ensure the porcelain tiles are from the same batch (Batch 22A) to avoid color variance. The warehouse will be closed on Friday afternoon."
              placeholder="Add any notes for the supplier or internal team..."
            />
          </section>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#edeeef] pt-10">
        <button 
          onClick={() => navigate('/purchases')}
          className="flex items-center gap-2 text-[#ba1a1a] font-bold text-[14px] px-6 py-3 rounded-lg hover:bg-red-50 transition-all uppercase tracking-widest"
        >
          <Trash className="w-5 h-5" />
          Cancel Purchase Order
        </button>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-8 py-3 bg-[#e1e3e4] text-[#43474c] font-bold text-[14px] rounded-lg hover:bg-[#d9dadb] transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
            <RotateCcw className="w-5 h-5" />
            Revert Changes
          </button>
          <button 
            onClick={() => {
              showToast('Purchase order updated successfully');
              navigate('/purchases');
            }}
            className="flex-1 md:flex-none px-10 py-3 bg-[#006397] text-white font-bold text-[14px] rounded-lg hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <CheckCircle className="w-5 h-5" />
            Update Order
          </button>
        </div>
      </div>

      {/* Audit Trail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-60 pt-8">
        {[
          { icon: User, label: 'Created By', value: 'Alex Rivera • Oct 24, 2023' },
          { icon: History, label: 'Last Modified', value: 'Today • 10:42 AM' },
          { icon: Key, label: 'PO Reference', value: '9928-SF-2023' },
        ].map((info, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl text-[#162839] border border-[#edeeef]">
              <info.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{info.label}</p>
              <p className="text-[14px] font-bold text-[#162839]">{info.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
