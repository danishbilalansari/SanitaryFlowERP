import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../store';
import { GlassSelect, GlassDatePicker } from '../components/GlassUI';

export default function AddAccountEntry() {
  const { addAccountEntry, customers, showToast, currency } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: 'Credit',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    referenceId: ''
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!formData.description || formData.amount <= 0) {
      setError('Please fill in a valid description and amount.');
      setSaving(false);
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
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      <div className="flex items-center space-x-4">
        <Link to="/accounts" className="w-10 h-10 glass-pill-button rounded-full flex items-center justify-center text-slate-600 hover:text-[#0284c7] transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add Account Entry</h1>
          <p className="text-[13px] text-slate-500 mt-1">Record an income, expense, or journal entry.</p>
        </div>
      </div>

      <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
        <div className="space-y-6">
          {error && (
            <div className="bg-rose-50/90 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-sm font-medium mb-4">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Entry Type *</label>
              <GlassSelect 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="Credit">Income / Credit / Received</option>
                <option value="Debit">Expense / Debit / Paid</option>
              </GlassSelect>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Date *</label>
              <GlassDatePicker
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Amount ({currency}) *</label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                className="w-full rounded-2xl bg-white/90 border border-white py-3 px-4 text-[14px] font-medium text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.03)] focus:ring-2 focus:ring-sky-400/40 outline-none transition-all" 
                placeholder="0" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Related Account / Party (Optional)</label>
              <GlassSelect 
                value={formData.referenceId}
                onChange={e => setFormData({...formData, referenceId: e.target.value})}
              >
                  <option value="">None / General</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name} (Customer)</option>
                  ))}
              </GlassSelect>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Description / Details *</label>
            <input 
              type="text" 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full rounded-2xl bg-white/90 border border-white py-3 px-4 text-[14px] font-medium text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.03)] focus:ring-2 focus:ring-sky-400/40 outline-none transition-all" 
              placeholder="e.g. Utility Bill Payment" 
            />
          </div>
        </div>

        <div className="pt-5 flex justify-end gap-3 border-t border-slate-200/60">
          <Link to="/accounts" className="px-6 py-2.5 text-[13.5px] font-semibold text-slate-700 glass-pill-button rounded-full transition-all">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={saving}
            className="px-7 py-2.5 text-[13.5px] font-semibold text-white bg-gradient-to-r from-[#0284c7] to-sky-500 hover:brightness-105 rounded-full transition-all shadow-[0_6px_20px_rgba(2,132,199,0.28)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving && (
               <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </form>
  );
}
