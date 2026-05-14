import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store';
import { 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  PauseCircle, 
  ChevronRight,
  TrendingUp,
  Trash2,
  Box,
  Factory as FactoryIcon,
  Search,
  X,
  Loader2,
  PlusCircle
} from 'lucide-react';
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

const CircularGauge = ({ percentage, label, sublabel, color = "#006397" }: { percentage: number, label: string, sublabel: string, color?: string, key?: React.Key }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="transparent" 
            stroke="#edeeef" 
            strokeWidth="8" 
          />
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="transparent" 
            stroke={color} 
            strokeWidth="8" 
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] sm:text-[24px] font-bold text-[#162839] leading-none">{percentage}%</span>
          <span className="text-[8px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Units</span>
        </div>
      </div>
      <div className="text-center mt-1">
        <p className="text-[9px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-widest leading-tight">{label}</p>
        <p className="text-[12px] sm:text-[14px] font-bold text-[#162839]">{sublabel}</p>
      </div>
    </div>
  );
};

export default function Factory() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageForm, setDamageForm] = useState({ type: 'Thermal Cracks', customType: '', quantity: 0, notes: '' });

  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [completeForm, setCompleteForm] = useState({
    actual_qty: 0,
    wastage_qty: 0,
    damaged_qty: 0,
    notes: ''
  });

  const { showToast } = useAppContext();

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [batchesRes, dashRes] = await Promise.all([
        fetch('/api/production', { credentials: 'include' }),
        fetch('/api/factory/dashboard', { credentials: 'include' })
      ]);
      
      if (batchesRes.ok) {
        const text = await batchesRes.text();
        const data = text ? JSON.parse(text) : [];
        setBatches(Array.isArray(data) ? data : []);
      }
      
      if (dashRes.ok) {
        setDashboardData(await dashRes.json());
      }
      
      setLoading(false);
      if (isManual) {
        // Quick delay for visual feedback
        setTimeout(() => setRefreshing(false), 600);
      }
    } catch (error) {
      console.error('Error fetching production data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBatches = async () => {
    fetchData(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = () => {
    if (!batches || batches.length === 0) {
      showToast?.('No data to export.', 'error');
      return;
    }

    // Sort batches similar to the table display
    const sortedBatches = [...batches].sort((a, b) => Number(b.id) - Number(a.id));

    // Build CSV content
    const headers = ['Batch #', 'Category', 'Product', 'Target Qty', 'Actual Qty', 'Wastage Qty', 'Damaged Qty', 'Status', 'Created At', 'Completed At'];
    const rows = sortedBatches.map(batch => [
      batch.batch_number,
      batch.category || 'N/A',
      batch.product_name,
      batch.target_qty,
      batch.status === 'Completed' ? batch.actual_qty : '-',
      batch.wastage_qty,
      batch.damaged_qty,
      batch.status,
      batch.created_at,
      batch.completed_at || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Production_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateStatus = async (batch: any) => {
    if (!batch) return;
    const currentStatus = (batch.status || '').toLowerCase().trim();
    
    console.log('Update Status Triggered:', { id: batch.id, status: currentStatus, batch });

    if (currentStatus.includes('progress')) {
      console.log('Opening Complete Modal for batch:', batch.batch_number);
      const targetQty = Number(batch.target_qty) || 0;
      const actualQty = Number(batch.actual_qty) || 0;
      
      setSelectedBatch(batch);
      setCompleteForm({
        actual_qty: targetQty > 0 ? targetQty : (actualQty > 0 ? actualQty : 100),
        wastage_qty: 0,
        damaged_qty: 0,
        notes: ''
      });
      setShowCompleteModal(true);
      return;
    }

    if (currentStatus === 'completed') return;

    // Transition from Scheduled -> In Progress
    const nextStatus = currentStatus === 'scheduled' ? 'In Progress' : 'In Progress';
    
    try {
      const payload: any = { status: nextStatus };
      if (nextStatus === 'In Progress') {
        payload.started_at = new Date().toISOString();
      }
      
      const response = await fetch(`/api/production/${batch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        fetchData(true);
        showToast?.(`Batch status updated to ${nextStatus}`, 'success');
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast?.(`Error updating status: ${errData.error || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCompleteBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    try {
      const payload = {
        status: 'Completed',
        actual_qty: Number(completeForm.actual_qty),
        wastage_qty: Number(completeForm.wastage_qty),
        damaged_qty: Number(completeForm.damaged_qty),
        notes: completeForm.notes
      };

      const response = await fetch(`/api/production/${selectedBatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // ... previous functionality
      if (response.ok) {
        setShowCompleteModal(false);
        fetchBatches();
        showToast?.('Batch completed successfully', 'success');
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast?.(`Error completing batch: ${errData.error || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Error completing batch:', error);
      showToast?.('Network error when completing batch.', 'error');
    }
  };

  const handleDamageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalType = damageForm.type === 'Other' ? damageForm.customType : damageForm.type;
      if (damageForm.type === 'Other' && !damageForm.customType) {
        showToast?.('Please specify the damage type', 'error');
        return;
      }

      const response = await fetch('/api/factory/damage-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...damageForm,
          type: finalType
        })
      });
      if (response.ok) {
        setShowDamageModal(false);
        setDamageForm({ type: 'Thermal Cracks', customType: '', quantity: 0, notes: '' });
        fetchData();
        showToast?.('Damage report logged successfully', 'success');
      } else {
        showToast?.('Failed to log damage report', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast?.('Network error.', 'error');
    }
  };

  const defaultDamageTypes = ['Thermal Cracks', 'Glaze Defects', 'Structural Failure'];
  const historicalTypes = Array.from(new Set((dashboardData?.damageReports || []).map((r: any) => r.type) as string[]));
  const availableTypes = Array.from(new Set([...defaultDamageTypes, ...historicalTypes]));

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Production</span>
          </nav>
          <h2 className="text-[28px] sm:text-[32px] font-black text-[#001d31] tracking-tight leading-none">Production Overview</h2>
          <p className="text-[14px] sm:text-[16px] text-neutral-500 mt-1">Live factory floor metrics and status for Line A-04.</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:gap-3">
          <Link to="/factory/add" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-[#162839] text-white text-[13px] sm:text-[14px] font-bold rounded-lg hover:brightness-110 transition-all shadow-md">
            <FactoryIcon className="w-4 h-4" />
            New Entry
          </Link>
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-white border border-[#c4c6cd] text-[#162839] text-[13px] sm:text-[14px] font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => fetchData(true)} 
            disabled={refreshing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-[#006397] text-white text-[13px] sm:text-[14px] font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {refreshing ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Output Target Gauges */}
        <div className="col-span-12 bg-white border border-[#edeeef] rounded-xl shadow-sm p-8">
          <h3 className="text-[18px] font-bold text-[#162839] mb-8">Today's Output Target</h3>
          <div className="flex justify-around items-center flex-wrap gap-8">
            {dashboardData?.outputTargets ? (
              dashboardData.outputTargets.map((ot: any, i: number) => (
                <CircularGauge 
                  key={i}
                  percentage={Math.min(100, Math.round((ot.actual / ot.target) * 100))} 
                  label={ot.label || ''} 
                  sublabel={`${(ot.actual || 0).toLocaleString()} / ${(ot.target || 5000).toLocaleString()}`} 
                  color={i === 1 ? "#5cb8fd" : "#006397"}
                />
              ))
            ) : (
              <>
                <CircularGauge percentage={0} label="Loading..." sublabel="0 / 5,000" />
                <CircularGauge percentage={0} label="Loading..." sublabel="0 / 2,000" color="#5cb8fd" />
              </>
            )}
          </div>
        </div>

        {/* Output Targets Breakdown Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-[#edeeef] rounded-xl shadow-sm p-8">
          <h3 className="text-[18px] font-bold text-[#162839] mb-8">Output Targets Breakdown</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={dashboardData?.outputTargets || []}
                   dataKey="actual"
                   nameKey="label"
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={100}
                   paddingAngle={5}
                 >
                   {(dashboardData?.outputTargets || []).map((_: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={index === 0 ? '#006397' : '#5cb8fd'} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

           <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            {/* Wastage Card */}
            <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm p-8 flex flex-col mb-8 lg:mb-0">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#162839]">Wastage / Scrap</h3>
                  <p className="text-[13px] text-neutral-500">Efficiency impact: <span className="text-red-500 font-bold">-3.2%</span></p>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-6">
                {(dashboardData?.damageReports || []).reduce((acc: any, rep: any) => {
                  const existing = acc.find((a: any) => a.type === rep.type);
                  if (existing) existing.quantity += rep.quantity;
                  else acc.push({ ...rep });
                  return acc;
                }, []).map((report: any, i: number) => {
                  // Some basic styling map
                  const isRed = report.type.includes('Crack') || report.type.includes('Failure');
                  const bgColor = isRed ? 'bg-red-500' : 'bg-[#5cb8fd]';
                  // Calculate dummy percentage out of 200 for progress bar (just for visual)
                  const pct = Math.min(100, Math.max(10, (report.quantity / 200) * 100));
                  
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${bgColor}`} />
                          <span className="text-[14px] font-medium text-[#162839]">{report.type}</span>
                        </div>
                        <span className="text-[14px] font-bold text-[#162839]">{report.quantity} units</span>
                      </div>
                      <div className="w-full bg-[#edeeef] h-2.5 rounded-full overflow-hidden">
                        <div className={`${bgColor} h-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={() => setShowDamageModal(true)}
                className="w-full mt-8 py-3 text-[14px] font-bold text-[#006397] border border-dashed border-[#c4c6cd] rounded-xl hover:bg-neutral-50 transition-colors"
              >
                Log New Damage Report
              </button>
           </div>

        </div>

        {/* Real Production Batches Table */}
        <div className="col-span-12 bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="bg-[#f3f4f5] px-6 py-4 border-b border-[#edeeef] flex justify-between items-center">
            <h3 className="text-[18px] font-bold text-[#162839]">Active Production Queue</h3>
            <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{batches.length} Batches Active</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#e1e3e4] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                  <th className="px-8 py-4">BATCH #</th>
                  <th className="px-8 py-4">TYPE</th>
                  <th className="px-8 py-4">PRODUCT</th>
                  <th className="px-8 py-4">YIELD / TARGET</th>
                  <th className="px-8 py-4">WASTAGE</th>
                  <th className="px-8 py-4">STATUS</th>
                  <th className="px-8 py-4">ACTION</th>
                </tr>
              </thead>
              <tbody className="text-[14px] divide-y divide-[#edeeef]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-10 text-center text-neutral-400">Loading factory floor data...</td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-10 text-center text-neutral-400 italic">No active production batches found.</td>
                  </tr>
                ) : (
                  [...batches].sort((a, b) => Number(b.id) - Number(a.id)).map((batch) => (
                    <tr key={batch.id} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="px-8 py-5 font-bold text-[#162839]">{batch.batch_number}</td>
                      <td className="px-8 py-5">
                        <span className="text-[11px] font-black uppercase text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded">
                          {batch.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[#162839] font-medium">{batch.product_name}</td>
                      <td className="px-8 py-5 font-bold text-[#162839]">
                        {batch.status === 'Completed' ? batch.actual_qty : '-'} / {batch.target_qty}
                      </td>
                      <td className="px-8 py-5">
                        {(batch.wastage_qty > 0 || batch.damaged_qty > 0) ? (
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-red-500">{batch.wastage_qty} Waste</span>
                            <span className="text-[10px] font-medium text-amber-500">{batch.damaged_qty} Damaged</span>
                          </div>
                        ) : (
                          <span className="text-neutral-300">-</span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          batch.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          batch.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          'bg-neutral-50 text-neutral-500 border-neutral-200'
                        }`}>
                          {batch.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {batch.status !== 'Completed' ? (
                          <button 
                            onClick={() => handleUpdateStatus(batch)}
                            className="bg-[#162839] text-white px-4 py-2 rounded-lg font-bold text-[11px] hover:opacity-90 transition-all shadow-sm"
                          >
                            {batch.status === 'Scheduled' ? 'Start' : 'Complete'}
                          </button>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-neutral-400 font-bold text-[12px]">Archived</span>
                            <span className="text-[10px] text-neutral-300">{(new Date(batch.completed_at || batch.created_at)).toLocaleDateString()}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {/* Modals via React Portal - Removed portal for better compatibility in iframe */}
    <AnimatePresence>
      {showDamageModal && (
        <div key="damage-modal-overlay" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#001d31]/60 backdrop-blur-[4px]" 
            onClick={() => setShowDamageModal(false)}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md min-w-[320px] overflow-hidden z-[10000] flex flex-col mx-4"
            style={{ minHeight: 'auto', maxHeight: '90vh' }}
          >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                 <h3 className="text-[18px] font-bold text-[#162839]">Log Damage Report</h3>
                 <button 
                   onClick={() => setShowDamageModal(false)} 
                   className="text-neutral-400 hover:text-neutral-600 p-2 transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleDamageSubmit} className="p-6 space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Damage Type</label>
                    <select 
                      value={damageForm.type}
                      onChange={e => setDamageForm({...damageForm, type: e.target.value})}
                      className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#5cb8fd]"
                    >
                      {availableTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                 </div>
                 {damageForm.type === 'Other' && (
                   <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Specify Damage Type</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Enter new damage type"
                        value={damageForm.customType}
                        onChange={e => setDamageForm({...damageForm, customType: e.target.value})}
                        className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#5cb8fd]"
                      />
                   </div>
                 )}
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Quantity</label>
                    <input 
                      required
                      type="number" 
                      value={damageForm.quantity || ''}
                      onChange={e => setDamageForm({...damageForm, quantity: Number(e.target.value)})}
                      className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl px-4 py-3 text-[16px] font-black text-[#162839] outline-none focus:ring-2 focus:ring-[#5cb8fd]"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Notes</label>
                    <textarea 
                      value={damageForm.notes}
                      onChange={e => setDamageForm({...damageForm, notes: e.target.value})}
                      placeholder="Optional details..."
                      className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#5cb8fd] resize-none"
                      rows={2}
                    />
                 </div>
                 <button type="submit" className="w-full bg-[#162839] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg mt-2">
                    Submit Report
                 </button>
              </form>
          </motion.div>
        </div>
      )}

      {showCompleteModal && (
        <div key="complete-modal-overlay" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#001d31]/60 backdrop-blur-[4px]" 
            onClick={() => setShowCompleteModal(false)}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md min-w-[320px] overflow-hidden z-[10000] flex flex-col mx-4"
            style={{ minHeight: 'auto', maxHeight: '90vh' }}
          >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-emerald-50/50">
                 <div>
                   <h3 className="text-[18px] font-bold text-[#162839]">Complete Batch {selectedBatch?.batch_number}</h3>
                   <p className="text-[12px] text-emerald-700 font-medium">Finalize production yield</p>
                 </div>
                 <button 
                   onClick={() => setShowCompleteModal(false)} 
                   className="text-neutral-400 hover:text-neutral-600 p-2 transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleCompleteBatch} className="p-6 space-y-4">
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Final Good Yield (Actual Qty)</label>
                       <input 
                        required
                        type="number" 
                        value={completeForm.actual_qty || ''}
                        onChange={e => setCompleteForm({...completeForm, actual_qty: Number(e.target.value)})}
                        className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl px-4 py-3 text-[16px] font-black text-[#162839] outline-none focus:ring-2 focus:ring-emerald-500"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Wastage Qty</label>
                          <input 
                            type="number" 
                            value={completeForm.wastage_qty || ''}
                            onChange={e => setCompleteForm({...completeForm, wastage_qty: Number(e.target.value)})}
                            className="w-full bg-[#fff5f5] border border-red-100 rounded-xl px-4 py-3 text-[14px] font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-200"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Damaged Qty</label>
                          <input 
                            type="number" 
                            value={completeForm.damaged_qty || ''}
                            onChange={e => setCompleteForm({...completeForm, damaged_qty: Number(e.target.value)})}
                            className="w-full bg-[#fffcf0] border border-amber-100 rounded-xl px-4 py-3 text-[14px] font-bold text-amber-600 outline-none focus:ring-2 focus:ring-amber-200"
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Wastage Reason / Notes</label>
                       <textarea 
                        value={completeForm.notes}
                        onChange={e => setCompleteForm({...completeForm, notes: e.target.value})}
                        placeholder="e.g. Broken in kiln, glazing defect..."
                        className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        rows={2}
                       />
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-[#162839] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg mt-2">
                    Confirm Completion & Sync Stock
                 </button>
              </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
