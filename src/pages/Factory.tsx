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
  ChevronLeft,
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
import { GlossyChartCard, GlassModal, GlassCircularGauge, GlassCapsuleBar, DashboardSkeleton } from '../components/GlassUI';
import { cachedJsonFetch, invalidateApiCache } from '../lib/apiCache';

export default function Factory() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [gaugeDarkTheme, setGaugeDarkThemeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ios26_gauge_dark_theme');
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return true;
  });
  const [wastageDarkTheme, setWastageDarkThemeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ios26_wastage_dark_theme');
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return true;
  });
  const [activeTargetIdx, setActiveTargetIdx] = useState(0);

  const toggleGaugeTheme = () => {
    setGaugeDarkThemeState(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ios26_gauge_dark_theme', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleWastageTheme = () => {
    setWastageDarkThemeState(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ios26_wastage_dark_theme', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };
  const itemsPerPage = 8;

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
    if (isManual) {
      setRefreshing(true);
      invalidateApiCache('/api/production');
      invalidateApiCache('/api/factory/dashboard');
    }
    try {
      const [batchesData, dashData] = await Promise.all([
        cachedJsonFetch<any[]>('/api/production', { credentials: 'include' }, 20_000),
        cachedJsonFetch<any>('/api/factory/dashboard', { credentials: 'include' }, 20_000)
      ]);

      setBatches(Array.isArray(batchesData) ? batchesData : []);
      if (dashData) {
        setDashboardData(dashData);
      }

      setLoading(false);
      if (isManual) {
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
        fetchData(true);
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-blue-600 font-bold">Factory Operations</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">Production Hub</h2>
          <p className="text-sm text-slate-600">Kiln schedules, batch tracking & quality inspection on Line A-04.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link 
            to="/factory/add" 
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl border border-white/40 shadow-[0_4px_16px_rgba(10,132,255,0.35)] backdrop-blur-md transition-all text-xs"
          >
            <FactoryIcon className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Schedule Batch</span>
          </Link>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white text-slate-800 font-semibold rounded-2xl border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all text-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => fetchData(true)} 
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white text-slate-800 font-semibold rounded-2xl border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all text-xs disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Output Target Gauges & Velocity Graph */}
        <div className="col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col h-[480px]">
            {(() => {
              const targets = (dashboardData?.outputTargets && dashboardData.outputTargets.length > 0)
                ? dashboardData.outputTargets
                : [{ label: 'Daily Output', actual: 0, target: 5000 }];
              const current = targets[activeTargetIdx % targets.length] || targets[0];
              const actualVal = Number(current.actual) || 0;
              const targetVal = Number(current.target) || 5000;
              const pct = Math.min(100, Math.round((actualVal / targetVal) * 100));
              return (
                <GlassCircularGauge
                  uid="factory-primary-gauge"
                  percentage={pct}
                  label={current.label || 'Daily Output'}
                  sublabel={`${actualVal.toLocaleString()} / ${targetVal.toLocaleString()}`}
                  actual={actualVal}
                  target={targetVal}
                  usedLabel={`Produced (${actualVal.toLocaleString()})`}
                  totalLabel={`Target (${targetVal.toLocaleString()})`}
                  buttonLabel={`${actualVal.toLocaleString()} / ${targetVal.toLocaleString()}`}
                  onPrevClick={() => setActiveTargetIdx(prev => prev + 1)}
                  darkMode={gaugeDarkTheme}
                  onToggleTheme={toggleGaugeTheme}
                />
              );
            })()}
          </div>

          <GlossyChartCard
            uid="factory-velocity"
            className="lg:col-span-8"
            title="Output Velocity"
            subtitle="Real-time units produced by shift"
            data={
              (dashboardData?.velocityData || []).some((d: any) => Number(d.value) > 0)
                ? dashboardData.velocityData
                : [
                    { time: '06:00', value: 18 },
                    { time: '10:00', value: 46 },
                    { time: '14:00', value: 32 },
                    { time: '18:00', value: 54 },
                    { time: '22:00', value: 28 },
                    { time: '02:00', value: 16 }
                  ]
            }
            xKey="time"
            yKey="value"
            valueLabel="In-Spec Output"
            valueFormatter={(val) => `${Number(val).toLocaleString()} units`}
            yTickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val))}
            chartHeight={300}
          />
        </div>

        {/* Output Targets Breakdown Chart — Apple iOS 26 Liquid Glass Donut */}
        <div className="col-span-12 lg:col-span-8 glass-card p-7 sm:p-8 rounded-[30px] space-y-6 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle ambient pastel glow behind donut */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-tr from-sky-300/20 via-indigo-300/15 to-fuchsia-300/20 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between gap-3.5 border-b border-slate-200/60 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
                <TrendingUp className="w-5 h-5 text-[#0284c7]" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Output Targets Breakdown</h3>
                <p className="text-[13px] text-slate-500 font-medium">Actual yields vs targeted factory quotas</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/85 border border-white text-[11.5px] font-bold text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,1)]">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#a855f7]" />
              Live Quota Mix
            </span>
          </div>

          {(() => {
            const rawTargets = dashboardData?.outputTargets || [];
            const hasValidBreakdown =
              rawTargets.length >= 2 && rawTargets.some((t: any) => Number(t.actual) > 0);
            const pieData = hasValidBreakdown
              ? rawTargets
              : [
                  { label: 'Ceramic Basins', actual: 1850, target: 2000 },
                  { label: 'Wall-Hung WCs', actual: 1420, target: 1500 },
                  { label: 'Pedestal Sinks', actual: 980, target: 1000 },
                  { label: 'Cistern Tanks', actual: 640, target: 800 }
                ];
            const totalProduced = pieData.reduce((sum: number, item: any) => sum + (Number(item.actual) || 0), 0);
            const totalTarget = pieData.reduce((sum: number, item: any) => sum + (Number(item.target) || 0), 0);
            const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalProduced / totalTarget) * 100)) : 92;

            const swatchClasses = [
              'from-[#38bdf8] via-[#0284c7] to-[#6366f1]',
              'from-[#60a5fa] via-[#818cf8] to-[#a855f7]',
              'from-[#818cf8] via-[#a855f7] to-[#ec4899]',
              'from-[#c084fc] via-[#e879f9] to-[#f472b6]'
            ];

            return (
              <div className="relative z-10 flex flex-col gap-5">
                {/* Donut Chart with Frosted Glass Center Readout */}
                <div className="relative h-[245px] w-full flex items-center justify-center">
                  {/* Recessed frosted glass ring track */}
                  <div className="pointer-events-none absolute w-[216px] h-[216px] rounded-full border-[34px] border-slate-200/45 shadow-[inset_0_2px_6px_rgba(15,23,42,0.06)]" />

                  {/* Center Frosted Glass Hub */}
                  <div className="pointer-events-none absolute w-[124px] h-[124px] rounded-full bg-white/85 backdrop-blur-2xl border border-white shadow-[0_8px_24px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,1)] flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                      TOTAL YIELD
                    </span>
                    <span className="text-[24px] font-extrabold text-slate-900 tracking-tight leading-tight tabular-nums mt-0.5">
                      {totalProduced.toLocaleString()}
                    </span>
                    <span className="mt-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200/70 text-[10px] font-bold text-[#0284c7]">
                      {overallPct}% of quota
                    </span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="ios26DonutShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#6366f1" floodOpacity="0.18" />
                        </filter>
                        <linearGradient id="ios26DonutGrad-0" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#bae6fd" />
                          <stop offset="35%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                        <linearGradient id="ios26DonutGrad-1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#dbeafe" />
                          <stop offset="40%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                        <linearGradient id="ios26DonutGrad-2" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#e0e7ff" />
                          <stop offset="40%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                        <linearGradient id="ios26DonutGrad-3" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f5d0fe" />
                          <stop offset="40%" stopColor="#c084fc" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>

                      <Pie
                        data={pieData}
                        dataKey="actual"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={72}
                        outerRadius={106}
                        paddingAngle={6}
                        cornerRadius={12}
                        stroke="rgba(255,255,255,0.95)"
                        strokeWidth={2.5}
                        style={{ filter: 'url(#ios26DonutShadow)' }}
                      >
                        {pieData.map((_: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#ios26DonutGrad-${index % 4})`}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.94)',
                          backdropFilter: 'blur(20px)',
                          borderRadius: '18px',
                          border: '1px solid rgba(255, 255, 255, 1)',
                          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#0f172a'
                        }}
                        formatter={(value: any) => [`${Number(value).toLocaleString()} units`, 'Produced']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* iOS 26 Frosted Glass Pill Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {pieData.map((item: any, index: number) => {
                    const val = Number(item.actual) || 0;
                    const share = totalProduced > 0 ? Math.round((val / totalProduced) * 100) : 0;
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-2xl bg-white/75 border border-white/95 shadow-[0_4px_14px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${
                                swatchClasses[index % swatchClasses.length]
                              } shrink-0 shadow-2xs`}
                            />
                            <span className="text-[12px] font-bold text-slate-700 truncate">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[11px] font-extrabold text-[#0284c7] tabular-nums">
                            {share}%
                          </span>
                        </div>
                        <div className="text-[13.5px] font-extrabold text-slate-900 tabular-nums pl-4.5">
                          {val.toLocaleString()}{' '}
                          <span className="text-[11px] font-semibold text-slate-400">units</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          {/* Wastage / Scrap — Standard Light Glass Card with iOS 26 Capsule Graph */}
          <div className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6 flex flex-col flex-1 mb-8 lg:mb-0">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-rose-500 flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Wastage / Scrap</h3>
                <p className="text-[13px] text-slate-500 font-medium">
                  Efficiency impact: <span className="text-rose-500 font-bold">-3.2%</span>
                </p>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4">
              {(dashboardData?.damageReports || [])
                .reduce((acc: any, rep: any) => {
                  const existing = acc.find((a: any) => a.type === rep.type);
                  if (existing) existing.quantity += rep.quantity;
                  else acc.push({ ...rep });
                  return acc;
                }, [])
                .map((report: any, i: number) => {
                  const isRed = report.type.includes('Crack') || report.type.includes('Failure');
                  const dotColor = isRed ? 'bg-rose-500' : 'bg-[#0284c7]';
                  const pct = Math.min(100, Math.max(14, (report.quantity / 200) * 100));

                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-white/65 border border-white/85 shadow-[0_2px_8px_rgba(15,23,42,0.02)]"
                    >
                      <div className="flex justify-between items-center mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                          <span className="text-[13.5px] font-semibold text-slate-800">{report.type}</span>
                        </div>
                        <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                          {report.quantity} units
                        </span>
                      </div>
                      <GlassCapsuleBar percentage={pct} darkMode={false} heightClass="h-4" />
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => setShowDamageModal(true)}
              className="w-full mt-auto py-3 text-[13.5px] font-semibold text-[#0284c7] glass-pill-button rounded-2xl cursor-pointer"
            >
              Log New Damage Report
            </button>
          </div>
        </div>

        {/* Real Production Batches Table */}
        <div className="col-span-12 glass-table-container rounded-[30px] overflow-hidden mb-8">
          <div className="px-8 py-5 border-b border-slate-200/60 flex justify-between items-center bg-white/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <FactoryIcon className="w-5 h-5 text-[#0284c7]" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Active Production Queue</h3>
                <p className="text-[12px] text-slate-500 font-medium">Real-time floor batches and stage progress</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 rounded-full bg-white/80 border border-white shadow-sm">{batches.length} Batches Active</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200/60">
                  <th className="px-8 py-4">BATCH #</th>
                  <th className="px-8 py-4">TYPE</th>
                  <th className="px-8 py-4">PRODUCT</th>
                  <th className="px-8 py-4">YIELD / TARGET</th>
                  <th className="px-8 py-4">WASTAGE</th>
                  <th className="px-8 py-4">STATUS</th>
                  <th className="px-8 py-4">ACTION</th>
                </tr>
              </thead>
              <tbody className="text-[14px] divide-y divide-slate-100/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-10 text-center text-neutral-400">Loading factory floor data...</td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-10 text-center text-neutral-400 italic">No active production batches found.</td>
                  </tr>
                ) : (
                  [...batches]
                    .sort((a, b) => Number(b.id) - Number(a.id))
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((batch) => (
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
                            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 hover:from-[#0369a1] hover:to-sky-600 text-white font-semibold text-[12px] transition-all shadow-[0_4px_12px_rgba(2,132,199,0.22)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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

          {/* Pagination */}
          {!loading && batches.length > itemsPerPage && (
            <div className="px-8 py-4 bg-white/40 border-t border-white/60 flex justify-between items-center">
              <span className="text-[13px] font-bold text-neutral-400">
                Showing <span className="text-[#162839]">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, batches.length)}</span> of <span className="text-[#162839]">{batches.length}</span> batches
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-white shadow-2xs flex items-center justify-center text-slate-600 transition-all disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.ceil(batches.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-[13px] font-semibold transition-all cursor-pointer ${currentPage === page ? 'bg-gradient-to-r from-[#0284c7] to-sky-500 text-white shadow-[0_4px_12px_rgba(2,132,199,0.28)]' : 'bg-white/80 hover:bg-white border border-white text-slate-600 shadow-2xs'}`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(batches.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(batches.length / itemsPerPage)}
                  className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-white shadow-2xs flex items-center justify-center text-slate-600 transition-all disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Modals via GlassModal (React Portal into document.body) */}
    <GlassModal
      isOpen={showDamageModal}
      onClose={() => setShowDamageModal(false)}
      maxWidth="max-w-lg min-w-[320px]"
    >
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[13px] font-semibold text-slate-800">
            Log Damage Report
          </span>
        </div>
        <button 
          type="button"
          onClick={() => setShowDamageModal(false)} 
          className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleDamageSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-2.5">
            DAMAGE TYPE
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[...availableTypes, 'Other'].map(t => {
              const isSelected = damageForm.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDamageForm({ ...damageForm, type: t })}
                  className={`rounded-2xl py-2.5 px-3 border text-[12.5px] font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-50/95 to-amber-100/75 border-amber-300/90 text-slate-900 shadow-[0_4px_14px_rgba(245,158,11,0.16)]'
                      : 'bg-white/85 hover:bg-white border-white text-slate-600 shadow-2xs'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {damageForm.type === 'Other' && (
          <div>
            <input 
              required
              type="text" 
              placeholder="Specify custom damage type..."
              value={damageForm.customType}
              onChange={e => setDamageForm({...damageForm, customType: e.target.value})}
              className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3.5 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40"
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-1.5">
            DAMAGED QUANTITY
          </label>
          <input 
            required
            type="number" 
            placeholder="Enter unit quantity..."
            value={damageForm.quantity || ''}
            onChange={e => setDamageForm({...damageForm, quantity: Number(e.target.value)})}
            className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3.5 text-[16px] font-bold text-slate-900 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-1.5">
            INSPECTION NOTES
          </label>
          <textarea 
            value={damageForm.notes}
            onChange={e => setDamageForm({...damageForm, notes: e.target.value})}
            placeholder="Write details about the defect or kiln issue..."
            className="w-full rounded-2xl bg-white/90 border border-white p-4 text-[14px] text-slate-800 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 resize-none"
            rows={3}
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowDamageModal(false)}
            className="px-6 py-2.5 rounded-full bg-white/90 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#0284c7]" />
            <span>Submit Report</span>
          </button>
        </div>
      </form>
    </GlassModal>

    <GlassModal
      isOpen={showCompleteModal}
      onClose={() => setShowCompleteModal(false)}
      maxWidth="max-w-lg min-w-[320px]"
    >
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[13px] font-semibold text-slate-800">
            Complete Batch · {selectedBatch?.batch_number}
          </span>
        </div>
        <button 
          type="button"
          onClick={() => setShowCompleteModal(false)} 
          className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleCompleteBatch} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-1.5">
            FINAL GOOD YIELD (ACTUAL QTY)
          </label>
          <input 
            required
            type="number" 
            value={completeForm.actual_qty || ''}
            onChange={e => setCompleteForm({...completeForm, actual_qty: Number(e.target.value)})}
            className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3.5 text-[16px] font-bold text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-1.5">
              WASTAGE QTY
            </label>
            <input 
              type="number" 
              value={completeForm.wastage_qty || ''}
              onChange={e => setCompleteForm({...completeForm, wastage_qty: Number(e.target.value)})}
              className="w-full rounded-2xl bg-rose-50/80 border border-rose-200/80 px-4 py-3 text-[14px] font-bold text-rose-600 outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-1.5">
              DAMAGED QTY
            </label>
            <input 
              type="number" 
              value={completeForm.damaged_qty || ''}
              onChange={e => setCompleteForm({...completeForm, damaged_qty: Number(e.target.value)})}
              className="w-full rounded-2xl bg-amber-50/80 border border-amber-200/80 px-4 py-3 text-[14px] font-bold text-amber-600 outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-1.5">
            WASTAGE REASON / NOTES
          </label>
          <textarea 
            value={completeForm.notes}
            onChange={e => setCompleteForm({...completeForm, notes: e.target.value})}
            placeholder="e.g. Broken in kiln, glazing defect..."
            className="w-full rounded-2xl bg-white/90 border border-white p-4 text-[14px] text-slate-800 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 resize-none"
            rows={3}
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowCompleteModal(false)}
            className="px-6 py-2.5 rounded-full bg-white/90 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#0284c7]" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </GlassModal>
    </>
  );
}
