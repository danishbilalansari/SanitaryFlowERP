import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../store';

export default function AddAccountEntry() {
  const { addAccountEntry, customers, showToast } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: 'Credit',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    referenceId: ''
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.description || formData.amount <= 0) {
      setError('Please fill in a valid description and amount.');
      return;
    }

    addAccountEntry({
      date: formData.date,
      description: formData.description,
      amount: formData.amount,
      type: formData.type as 'Credit' | 'Debit',
      referenceId: formData.referenceId
    });
    
    showToast('Account entry saved successfully!', 'success');
    navigate('/accounts');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link to="/accounts" className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Add Account Entry</h1>
          <p className="text-[13px] text-neutral-500 mt-1">Record an income, expense, or journal entry.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700 block">Entry Type *</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full border border-neutral-200/80 rounded-lg py-2.5 px-3.5 text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-neutral-50/50 focus:bg-white"
              >
                <option value="Credit">Income / Credit / Received</option>
                <option value="Debit">Expense / Debit / Paid</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700 block">Date *</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full border border-neutral-200/80 rounded-lg py-2.5 px-3.5 text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-neutral-50/50 focus:bg-white" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-neutral-700 block">Amount (Rs.) *</label>
            <input 
              type="number" 
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
              className="w-full border border-neutral-200/80 rounded-lg py-2.5 px-3.5 text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-neutral-50/50 focus:bg-white" 
              placeholder="0" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-neutral-700 block">Description / Details *</label>
            <input 
              type="text" 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full border border-neutral-200/80 rounded-lg py-2.5 px-3.5 text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-neutral-50/50 focus:bg-white" 
              placeholder="e.g. Utility Bill Payment" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-neutral-700 block">Related Account / Party (Optional)</label>
            <select 
              value={formData.referenceId}
              onChange={e => setFormData({...formData, referenceId: e.target.value})}
              className="w-full border border-neutral-200/80 rounded-lg py-2.5 px-3.5 text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-neutral-50/50 focus:bg-white"
            >
                <option value="">None / General</option>
                {customers.map(c => (
                  <option key={c.id} value={c.name}>{c.name} (Customer)</option>
                ))}
            </select>
          </div>

        </div>

        <div className="bg-neutral-50/30 px-6 py-4 flex justify-end gap-3 border-t border-neutral-100">
          <Link to="/accounts" className="px-4 py-2 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200/80 bg-white shadow-sm">
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors border border-transparent shadow-sm">
            Save Entry
          </button>
        </div>
      </div>
    </form>
  );
}
