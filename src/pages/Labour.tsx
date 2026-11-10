import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronRight, Wallet, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import { TableSkeletonRows, GlassEmptyState, GlassDatePicker, GlassPagination, GlassModal } from '../components/GlassUI';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

interface Labour {
  id: number;
  name: string;
  cnic: string;
  address: string;
  mobile_no: string;
  designation: string;
  salary: number;
}

interface Advance {
  id: number;
  labour_id: number;
  amount: number;
  date_text: string;
  description: string;
  created_at: string;
}

export default function LabourPage() {
  const cachedLabour = peekApiCache<Labour[]>('/api/labour', 60_000);
  const [labour, setLabour] = useState<Labour[]>(() => Array.isArray(cachedLabour) ? cachedLabour : []);
  const [loading, setLoading] = useState<boolean>(() => !Array.isArray(cachedLabour));
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ id: 0, name: '', cnic: '', address: '', mobile_no: '', designation: '', salary: 0 });
  
  const [expandedLabour, setExpandedLabour] = useState<Labour | null>(null);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [advanceFormData, setAdvanceFormData] = useState({ amount: '', date_text: '', description: '' });
  
  const { showToast, currency } = useAppContext();

  const formatCNIC = (value: string) => {
    const v = value.replace(/\D/g, '');
    const match = v.match(/^(\d{0,5})(\d{0,7})(\d{0,1})$/);
    if (!match) return v;
    return !match[2] ? match[1] : `${match[1]}-${match[2]}${match[3] ? `-${match[3]}` : ''}`;
  };

  const formatMobile = (value: string) => {
    const v = value.replace(/\D/g, '');
    const match = v.match(/^(\d{0,4})(\d{0,7})$/);
    if (!match) return v;
    return !match[2] ? match[1] : `${match[1]}-${match[2]}`;
  };

  const fetchLabour = async (forceRefresh = false) => {
    if (forceRefresh) {
      invalidateApiCache('/api/labour');
    }
    try {
      const data = await cachedJsonFetch<Labour[]>('/api/labour', { credentials: 'include' }, 60_000);
      setLabour(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showToast?.('Failed to fetch labour info', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabour();
  }, []);

  const fetchAdvances = async (labourId: number, forceRefresh = false) => {
    if (forceRefresh) {
      invalidateApiCache(`/api/labour/${labourId}/advances`);
    }
    const cached = !forceRefresh ? peekApiCache<Advance[]>(`/api/labour/${labourId}/advances`, 60_000) : undefined;
    if (Array.isArray(cached)) {
      setAdvances(cached);
      setAdvanceLoading(false);
      return;
    }
    setAdvanceLoading(true);
    try {
      const data = await cachedJsonFetch<Advance[]>(
        `/api/labour/${labourId}/advances`,
        { credentials: 'include' },
        60_000
      );
      setAdvances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showToast?.('Failed to fetch advances', 'error');
    } finally {
      setAdvanceLoading(false);
    }
  };

  const handleOpenAdvances = (lab: Labour) => {
    if (expandedLabour?.id === lab.id) {
      setExpandedLabour(null);
    } else {
      const cached = peekApiCache<Advance[]>(`/api/labour/${lab.id}/advances`, 60_000);
      if (Array.isArray(cached)) {
        setAdvances(cached);
        setAdvanceLoading(false);
      } else {
        setAdvanceLoading(true);
        setAdvances([]);
      }
      setExpandedLabour(lab);
      fetchAdvances(lab.id);
    }
  };

  const handleSaveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedLabour) return;
    try {
      const res = await fetch(`/api/labour/${expandedLabour.id}/advances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(advanceFormData)
      });
      if (!res.ok) throw new Error('Failed to save advance');
      
      setAdvanceFormData({ amount: '', date_text: '', description: '' });
      fetchAdvances(expandedLabour.id, true);
      showToast?.('Advance recorded', 'success');
    } catch (err) {
      console.error(err);
      showToast?.('Failed to save advance', 'error');
    }
  };

  const handleDeleteAdvance = async (id: number) => {
    if (!expandedLabour) return;
    try {
      const res = await fetch(`/api/labour_advances/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete advance');
      fetchAdvances(expandedLabour.id, true);
    } catch (err) {
      console.error(err);
      showToast?.('Failed to delete advance', 'error');
    }
  };

  const handleOpenModal = (lab: Labour | null = null) => {
    if (lab) {
      setFormData({
        id: lab.id,
        name: lab.name ?? '',
        cnic: lab.cnic ?? '',
        address: lab.address ?? '',
        mobile_no: lab.mobile_no ?? '',
        designation: lab.designation ?? '',
        salary: Number(lab.salary) || 0
      });
    } else {
      setFormData({ id: 0, name: '', cnic: '', address: '', mobile_no: '', designation: '', salary: 0 });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = formData.id !== 0;
      const url = isEdit ? `/api/labour/${formData.id}` : '/api/labour';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save labour');
      
      showToast?.(`Labour ${isEdit ? 'updated' : 'added'} successfully`, 'success');
      setShowModal(false);
      fetchLabour(true);
    } catch (err) {
      console.error(err);
      showToast?.('Failed to save labour info', 'error');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/labour/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast?.('Labour record deleted', 'success');
      fetchLabour(true);
    } catch (err) {
      console.error(err);
      showToast?.('Failed to delete labour', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredLabour = labour.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.cnic.includes(searchQuery) ||
    l.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/" className="hover:text-[#0284c7] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0284c7] font-bold">Labour</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">Labour & Payroll</h1>
          <p className="text-sm text-slate-600">Manage factory workforce, designations, salaries and advance payments.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold hover:brightness-105 transition-all shadow-[0_4px_16px_rgba(2,132,199,0.3)] text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Labour</span>
        </button>
      </div>

      {/* Filter Bar — Apple iOS 26 Liquid Glass Search Toolbar */}
      <div className="glass-search-toolbar flex flex-col md:flex-row gap-3.5 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0284c7] transition-colors pointer-events-none z-10" />
          <input 
            type="text"
            placeholder="Search by worker name, CNIC, or designation..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-3 rounded-full text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>
      </div>

      <div className="glass-table-container flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">CNIC</th>
                <th className="px-6 py-4">Mobile No</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4 text-right">Salary</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13.5px]">
              {loading ? (
                <TableSkeletonRows columns={7} rows={6} />
              ) : filteredLabour.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <GlassEmptyState
                      isSearch={Boolean(searchQuery)}
                      title={searchQuery ? 'No matching workers found' : 'No labour records yet'}
                      description={searchQuery ? 'Try adjusting your search query by name, CNIC, or designation.' : 'Add workforce members to track salaries and advance payments.'}
                      onReset={searchQuery ? () => setSearchQuery('') : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filteredLabour
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map(lab => (
                  <React.Fragment key={lab.id}>
                  <tr className={`${expandedLabour?.id === lab.id ? 'bg-white/90' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-900">{lab.name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600 tabular-nums">{lab.cnic}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600 tabular-nums">{lab.mobile_no}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[200px]" title={lab.address}>{lab.address}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-sky-50/90 border border-sky-200/80 text-sky-700 rounded-full text-[11px] font-semibold">
                        {lab.designation}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                      {Number(lab.salary).toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenAdvances(lab)} className={`w-8 h-8 inline-flex items-center justify-center rounded-full border transition-all ${expandedLabour?.id === lab.id ? 'text-white bg-emerald-600 border-emerald-600 shadow-sm' : 'text-emerald-600 bg-white/85 hover:bg-white border-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]'}`} title="Advances">
                          {expandedLabour?.id === lab.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleOpenModal(lab)} className="w-8 h-8 inline-flex items-center justify-center text-[#0284c7] bg-white/85 hover:bg-white border border-white rounded-full shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(lab.id)} className="w-8 h-8 inline-flex items-center justify-center text-rose-500 bg-white/85 hover:bg-white border border-white rounded-full shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedLabour?.id === lab.id && (
                    <tr className="bg-white/60">
                      <td colSpan={7} className="p-0">
                        <div className="p-6 md:px-10 bg-white/75 backdrop-blur-2xl border-y border-white flex flex-col xl:flex-row gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          
                          <div className="flex-1 space-y-5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em]">Advance Payment History</h4>
                            <div className="rounded-2xl bg-white/80 border border-white shadow-sm overflow-hidden">
                              <table className="w-full text-left">
                                <thead>
                                  <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-right">Advance Amount</th>
                                    <th className="px-4 py-3 text-right">Remaining Balance</th>
                                    <th className="px-4 py-3 text-center w-16">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="text-[13px]">
                                  {advanceLoading ? (
                                    <TableSkeletonRows columns={5} rows={2} />
                                  ) : advances.length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No advance payments recorded.</td>
                                    </tr>
                                  ) : (
                                    (() => {
                                      let runningBalance = Number(lab.salary);
                                      return advances.map(adv => {
                                        runningBalance -= Number(adv.amount);
                                        return (
                                          <tr key={adv.id}>
                                            <td className="px-4 py-3 font-semibold text-slate-900 tabular-nums">{adv.date_text}</td>
                                            <td className="px-4 py-3 text-slate-500">{adv.description || '-'}</td>
                                            <td className="px-4 py-3 text-right text-rose-500 font-bold tabular-nums">{formatCurrency(Number(adv.amount), currency)}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">{formatCurrency(runningBalance, currency)}</td>
                                            <td className="px-4 py-3 text-center">
                                              <button onClick={() => handleDeleteAdvance(adv.id)} className="w-7 h-7 inline-flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-full transition-colors" title="Delete">
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      });
                                    })()
                                  )}
                                </tbody>
                              </table>
                            </div>
                            
                            <form onSubmit={handleSaveAdvance} className="flex flex-wrap gap-3.5 items-end bg-white/75 backdrop-blur-xl p-4 rounded-2xl border border-white shadow-2xs">
                              <div className="flex-1 min-w-[160px] space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] block">Date</label>
                                <GlassDatePicker
                                  required
                                  value={advanceFormData.date_text}
                                  onChange={e => setAdvanceFormData({...advanceFormData, date_text: e.target.value})}
                                />
                              </div>
                              <div className="flex-1 min-w-[160px] space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] block">Description (Optional)</label>
                                <input 
                                  type="text" value={advanceFormData.description} 
                                  onChange={e => setAdvanceFormData({...advanceFormData, description: e.target.value})}
                                  placeholder="e.g. Medical, Bonus"
                                  className="w-full rounded-2xl px-4 py-2.5 text-[13.5px] font-medium outline-none transition-all"
                                />
                              </div>
                              <div className="flex-1 min-w-[140px] space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] block">Amount</label>
                                <input 
                                  type="number" required value={advanceFormData.amount} 
                                  onChange={e => setAdvanceFormData({...advanceFormData, amount: e.target.value})}
                                  placeholder="Enter amount"
                                  className="w-full rounded-2xl px-4 py-2.5 text-[13.5px] font-medium outline-none transition-all"
                                />
                              </div>
                              <button 
                                type="submit"
                                disabled={advanceLoading || !advanceFormData.amount || !advanceFormData.date_text}
                                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white text-xs font-semibold shadow-[0_4px_12px_rgba(2,132,199,0.25)] hover:brightness-105 transition-all disabled:opacity-50 h-[44px]"
                              >
                                Add Advance
                              </button>
                            </form>
                          </div>

                          <div className="w-full xl:w-80">
                            {(() => {
                              const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount), 0);
                              const remaining = Number(lab.salary) - totalAdvances;
                              const extraAmount = !advanceLoading && totalAdvances > Number(lab.salary) ? totalAdvances - Number(lab.salary) : 0;
                              
                              return (
                                <div className="bg-white/85 backdrop-blur-xl border border-white rounded-2xl p-5 shadow-sm sticky top-6">
                                  <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-[0.1em]">Salary Summary</h4>
                                  <div className="grid grid-cols-2 gap-y-3 text-[13.5px] items-center">
                                    <div className="text-slate-500">Total Salary:</div>
                                    <div className="text-right font-bold text-slate-900 tabular-nums">{formatCurrency(Number(lab.salary), currency)}</div>
                                    
                                    <div className="text-slate-500">Advances Count:</div>
                                    <div className="text-right font-bold text-slate-900 tabular-nums flex justify-end">
                                      {advanceLoading ? (
                                        <span className="h-4 w-8 rounded-full bg-slate-200/80 animate-pulse inline-block" />
                                      ) : (
                                        advances.length
                                      )}
                                    </div>
                                    
                                    <div className="text-slate-500">Total Taken:</div>
                                    <div className="text-right font-bold text-rose-500 tabular-nums flex justify-end">
                                      {advanceLoading ? (
                                        <span className="h-4 w-20 rounded-full bg-slate-200/80 animate-pulse inline-block" />
                                      ) : (
                                        formatCurrency(totalAdvances, currency)
                                      )}
                                    </div>
                                    
                                    <div className="text-slate-500 border-t border-slate-200/60 pt-3 mt-1">Remaining:</div>
                                    <div className={`text-right font-extrabold text-[15px] border-t border-slate-200/60 pt-3 mt-1 tabular-nums flex justify-end ${remaining < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                      {advanceLoading ? (
                                        <span className="h-5 w-24 rounded-full bg-slate-200/80 animate-pulse inline-block" />
                                      ) : (
                                        formatCurrency(remaining, currency)
                                      )}
                                    </div>
                                  </div>
                                  {extraAmount > 0 && (
                                    <div className="mt-4 p-3 bg-rose-50/90 border border-rose-200/80 rounded-xl text-rose-700 text-xs font-semibold text-center">
                                      Warning: Advances exceed salary by {formatCurrency(extraAmount, currency)}.
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <GlassPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredLabour.length / itemsPerPage)}
          totalItems={filteredLabour.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="workers"
        />
      </div>

      {/* Add / Edit Labour Modal */}
      <GlassModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="max-w-lg w-full sm:w-[480px]"
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
            <span className="text-[13px] font-semibold text-slate-800">
              {formData.id ? 'Edit Labour Record' : 'Add Labour Record'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase block">FULL NAME</label>
            <input 
              type="text" required value={formData.name} 
              placeholder="Worker full name..."
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3.5 text-[14.5px] font-semibold text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase block">CNIC</label>
              <input 
                type="text" required value={formData.cnic} 
                onChange={e => setFormData({...formData, cnic: formatCNIC(e.target.value)})}
                placeholder="XXXXX-XXXXXXX-X"
                maxLength={15}
                className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3 text-[13.5px] font-medium text-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase block">MOBILE NO</label>
              <input 
                type="text" required value={formData.mobile_no} 
                onChange={e => setFormData({...formData, mobile_no: formatMobile(e.target.value)})}
                placeholder="XXXX-XXXXXXX"
                maxLength={12}
                className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3 text-[13.5px] font-medium text-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase block">ADDRESS</label>
            <input 
              type="text" required value={formData.address} 
              placeholder="Residential address..."
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3 text-[13.5px] font-medium text-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase block">DESIGNATION</label>
              <input 
                type="text" required value={formData.designation} 
                onChange={e => setFormData({...formData, designation: e.target.value})}
                placeholder="e.g. Worker, Supervisor"
                className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3 text-[13.5px] font-medium text-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase block">SALARY</label>
              <input 
                type="number" required value={formData.salary || ''} 
                onChange={e => setFormData({...formData, salary: Number(e.target.value)})}
                className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3 text-[13.5px] font-bold text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-3 justify-end">
            <button 
              type="button" 
              onClick={() => setShowModal(false)}
              className="px-6 py-2.5 rounded-full bg-white/90 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)] flex items-center gap-2 transition-all cursor-pointer"
            >
              <span className="text-[#0284c7] font-bold">✓</span>
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Delete Confirmation Modal */}
      <GlassModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        maxWidth="max-w-md sm:w-[420px]"
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[13px] font-semibold text-slate-800">Delete Labour Record</span>
          </div>
          <button
            onClick={() => setDeleteId(null)}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-2xs flex items-center justify-center text-slate-600"
          >
            ✕
          </button>
        </div>
        <div className="rounded-2xl bg-white/90 border border-white p-4 shadow-2xs mb-5">
          <p className="text-slate-700 text-[13.5px] leading-relaxed">
            Are you sure you want to delete this labour record? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeleteId(null)}
            className="px-6 py-2.5 rounded-full bg-white/90 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-rose-600 shadow-[0_6px_18px_rgba(15,23,42,0.08)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </GlassModal>
    </div>
  );
}
