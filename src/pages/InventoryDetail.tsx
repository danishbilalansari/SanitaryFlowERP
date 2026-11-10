import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit, 
  ShoppingCart, 
  Factory, 
  Truck,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ItemImage } from '../components/ItemImage';
import { GlossyChartCard, GlassSelect, GlassPillTabs, GlassPagination, GlassModal, DashboardSkeleton } from '../components/GlassUI';
import { motion } from 'motion/react';
import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import { cachedJsonFetch, peekApiCache, invalidateApiCache } from '../lib/apiCache';

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  status: string;
  description?: string;
  brand?: string;
  product_line?: string;
  size?: string;
  packing?: string;
  unit?: string;
  warehouse?: string;
  image?: string;
}

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, currency } = useAppContext();

  const cachedItem = id
    ? (peekApiCache<InventoryItem>(`/api/inventory/${id}`, 60_000) ??
       peekApiCache<InventoryItem[]>('/api/inventory', 60_000)?.find(i => String(i.id) === String(id)) ??
       null)
    : null;
  const cachedTrends = id ? peekApiCache<any[]>(`/api/inventory/${id}/trends`, 60_000) : undefined;
  const cachedDist = id ? peekApiCache<any[]>(`/api/inventory/${id}/distribution`, 60_000) : undefined;
  const cachedTx = id ? peekApiCache<any[]>(`/api/inventory/${id}/transactions?type=All`, 60_000) : undefined;

  const [item, setItem] = useState<InventoryItem | null>(() => cachedItem);
  const [loading, setLoading] = useState<boolean>(() => !cachedItem);
  const [transactions, setTransactions] = useState<any[]>(() => Array.isArray(cachedTx) ? cachedTx : []);
  const [transactionType, setTransactionType] = useState('All');
  const [trendData, setTrendData] = useState<any[]>(() => Array.isArray(cachedTrends) ? cachedTrends : []);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(() => !Array.isArray(cachedTx));
  const [distribution, setDistribution] = useState<any[]>(() => Array.isArray(cachedDist) ? cachedDist : []);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 6;

  const fetchTrends = (force = false) => {
    if (!id) return;
    const url = `/api/inventory/${id}/trends`;
    if (force) invalidateApiCache(url);
    cachedJsonFetch<any[]>(url, { credentials: 'include' }, 60_000)
      .then(data => setTrendData(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  const fetchDistribution = (force = false) => {
    if (!id) return;
    const url = `/api/inventory/${id}/distribution`;
    if (force) invalidateApiCache(url);
    cachedJsonFetch<any[]>(url, { credentials: 'include' }, 60_000)
      .then(data => setDistribution(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  const fetchHistory = (type: string, force = false) => {
    if (!id) return;
    const url = `/api/inventory/${id}/transactions?type=${type}`;
    if (force) invalidateApiCache(url);
    const cached = peekApiCache<any[]>(url, 60_000);
    if (Array.isArray(cached) && !force) {
      setTransactions(cached);
      setHistoryPage(1);
      setLoadingHistory(false);
    } else {
      setLoadingHistory(true);
    }
    cachedJsonFetch<any[]>(url, { credentials: 'include' }, 60_000)
      .then(data => {
        setTransactions(Array.isArray(data) ? data : []);
        setHistoryPage(1);
        setLoadingHistory(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingHistory(false);
      });
  };

  useEffect(() => {
    if (!id) return;
    cachedJsonFetch<InventoryItem>(`/api/inventory/${id}`, { credentials: 'include' }, 60_000)
      .then(data => {
        if (data) setItem(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching item:', err);
        setLoading(false);
      });
    
    fetchHistory('All');
    fetchDistribution();
  }, [id]);

  useEffect(() => {
    fetchTrends();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchTrends(true);
    }, 60_000);
    return () => clearInterval(interval);
  }, [id]);

  const [showAdjust, setShowAdjust] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [adjustment, setAdjustment] = useState({ type: 'add', quantity: 0, reason: '' });
  const [transfer, setTransfer] = useState({ toWarehouse: 'Secondary Storage (B-4)', quantity: 0 });

  const handleAdjust = async () => {
    if (adjustment.quantity <= 0) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }
    setIsAdjusting(true);
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item?.id, ...adjustment })
      });
      if (res.ok) {
        invalidateApiCache('/api/inventory');
        invalidateApiCache('/api/shop/dashboard');
        showToast('Inventory adjusted successfully', 'success');
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (item) setItem({ ...item, stock: data.newStock });
        setShowAdjust(false);
        fetchHistory(transactionType, true);
        fetchTrends(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Adjustment failed', 'error');
      }
    } catch (err) {
      console.error('Adjustment failed:', err);
      showToast('Network error occurred during adjustment', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleTransfer = async () => {
    if (transfer.quantity <= 0) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }
    if (item && transfer.quantity > item.stock) {
      showToast(`Cannot transfer more than available stock (${item.stock})`, 'error');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: item?.id, 
          toWarehouse: transfer.toWarehouse,
          quantity: transfer.quantity 
        })
      });
      if (res.ok) {
        invalidateApiCache('/api/inventory');
        invalidateApiCache('/api/shop/dashboard');
        showToast('Stock transfer successful', 'success');
        setShowTransfer(false);
        fetchHistory(transactionType, true);
        fetchDistribution(true);
        fetchTrends(true);
        cachedJsonFetch<InventoryItem>(`/api/inventory/${id}`, { credentials: 'include' }, 30_000)
          .then(data => { if (data) setItem(data); })
          .catch(err => console.error('Error refreshing item:', err));
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Transfer failed', 'error');
      }
    } catch (err) {
      console.error('Transfer failed:', err);
      showToast('Network error occurred during transfer', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!item) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-[#162839]">Item not found</h2>
        <button onClick={() => navigate('/inventory')} className="mt-4 text-[#006397] font-bold">Back to Inventory</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Top Navbar Contextual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/inventory')}
            className="glass-pill-button w-11 h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <nav className="flex items-center gap-2 text-[12px] font-medium text-neutral-400 mb-1">
              <Link to="/inventory" className="hover:text-[#006397] transition-colors">Inventory</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#006397] font-bold">Item Detail</span>
            </nav>
            <h2 className="text-[28px] font-black text-[#001d31] tracking-tight leading-none">Inventory Detail</h2>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 glass-card p-8 rounded-[32px] flex flex-col md:flex-row gap-8 items-start">
          <div className="w-48 h-48 bg-white/80 rounded-2xl flex items-center justify-center border border-white shrink-0 overflow-hidden shadow-2xs">
            <ItemImage src={item.image} name={item.name} className="w-full h-full object-cover text-3xl" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
              <div className="flex-1 min-w-0">
                <span className="inline-block bg-sky-100/80 border border-sky-200/80 text-[#0284c7] text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full mb-3">
                  SKU: {item.sku}
                </span>
                <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight">{item.name}</h1>
                <p className="text-[14px] text-slate-500 font-medium mt-3 leading-relaxed">
                  {item.description || 'No description available for this SKU.'}
                </p>
              </div>
                <div className="flex flex-wrap gap-2.5 shrink-0">
                <button 
                  onClick={() => setShowAdjust(true)}
                  className="glass-pill-button px-6 py-2.5 rounded-full text-slate-800 font-semibold hover:bg-white/95 transition-all flex items-center gap-2 text-[13.5px] cursor-pointer"
                >
                  Adjust Stock
                </button>
                <button 
                  onClick={() => navigate(`/inventory/edit/${item.id}`)}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 hover:from-[#0369a1] hover:to-sky-600 text-white font-semibold transition-all shadow-[0_6px_20px_rgba(2,132,199,0.28)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 text-[13.5px] cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  Edit Item
                </button>
              </div>
            </div>

            {showAdjust && (
              <div className="mt-6 p-6 bg-white/80 rounded-2xl border border-sky-300 space-y-4 shadow-sm animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Inventory Adjustment</h4>
                  <button onClick={() => setShowAdjust(false)} className="text-slate-400 hover:text-rose-500 font-bold text-xs cursor-pointer">Cancel</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <GlassSelect 
                     value={adjustment.type}
                     onChange={e => setAdjustment({...adjustment, type: e.target.value})}
                   >
                     <option value="add">Add Stock</option>
                     <option value="subtract">Subtract Stock</option>
                   </GlassSelect>
                   <input 
                     type="number" 
                     placeholder="Quantity"
                     value={adjustment.quantity || ''}
                     onChange={e => setAdjustment({...adjustment, quantity: Number(e.target.value)})}
                     className="rounded-xl p-2.5 outline-none font-bold text-[13px]"
                   />
                   <input 
                     type="text" 
                     placeholder="Reason (e.g. Damage, Audit)"
                     value={adjustment.reason}
                     onChange={e => setAdjustment({...adjustment, reason: e.target.value})}
                     className="rounded-xl p-2.5 outline-none font-bold text-[13px]"
                   />
                </div>
                <button 
                  onClick={handleAdjust}
                  disabled={isAdjusting}
                  className="w-full rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 hover:from-[#0369a1] hover:to-sky-600 text-white font-semibold py-3 transition-all shadow-[0_6px_20px_rgba(2,132,199,0.25)] text-[13.5px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isAdjusting && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isAdjusting ? 'Adjusting...' : 'Confirm Adjustment'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-8 mt-10 pt-6 border-t border-slate-200/60">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">On Hand</p>
                <p className={`text-[28px] font-extrabold leading-none ${item.stock < item.minStock ? 'text-rose-500' : 'text-slate-900'}`}>
                  {(item.stock ?? 0).toLocaleString()} <span className="text-[13px] font-semibold text-slate-400 ml-1">units</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Safety Stock</p>
                <p className="text-[28px] font-extrabold text-[#0284c7] leading-none">
                  {item.minStock ?? 0} <span className="text-[13px] font-semibold text-slate-400 ml-1">units</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Unit Price</p>
                <p className="text-[28px] font-extrabold text-emerald-600 leading-none">
                  {formatCurrency(item.price ?? 0, currency)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
            <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Technical Specs</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Category', value: item.category },
              { label: 'Brand', value: item.brand || '-' },
              { label: 'Product Line', value: item.product_line || '-' },
              { label: 'Size', value: item.size || '-' },
              { label: 'Packing', value: item.packing || '-' },
              { label: 'Unit', value: item.unit || 'Piece' },
              { label: 'Warehouse', value: item.warehouse || 'Central WH' },
              { label: 'Status', value: item.stock < item.minStock ? 'LOW STOCK' : 'IN STOCK' }
            ].map((spec, i) => (
              <div key={i} className="flex justify-between items-center text-[13px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">{spec.label}</span>
                <span className="font-bold text-slate-900">{spec.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Dashboard Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Stock Trend */}
        <GlossyChartCard
          uid="inventory-stock-trend"
          className="xl:col-span-2"
          title="Stock Level Trends"
          subtitle="Tracking inventory balance history across cycles"
          data={
            (trendData || []).some((d: any) => Number(d.value) > 0)
              ? trendData
              : [
                  { name: 'Cycle 1', value: 18 },
                  { name: 'Cycle 2', value: 45 },
                  { name: 'Cycle 3', value: 28 },
                  { name: 'Cycle 4', value: 36 }
                ]
          }
          xKey="name"
          yKey="value"
          valueLabel="Stock Balance"
          valueFormatter={(val) => `${Number(val).toLocaleString()} ${item.unit || 'units'}`}
          chartHeight={310}
        />

        {/* Distribution */}
        <section className="glass-card p-8 rounded-[32px] flex flex-col">
          <div className="pb-5 mb-6 border-b border-slate-200/60">
            <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Warehouse Distribution</h3>
          </div>
          <div className="space-y-6 flex-1">
            {distribution.map((dist, i) => (
              <div key={i} className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-[13.5px]">{dist.name}</span>
                  <span className="text-[13.5px] font-extrabold text-slate-900">{dist.qty} <span className="text-slate-400 text-[11.5px] font-bold">units</span></span>
                </div>
                <div className="w-full bg-slate-100/90 rounded-full h-2.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(dist.qty / dist.total) * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    className={`${dist.color} h-full rounded-full`} 
                  />
                </div>
              </div>
            ))}
            {distribution.length === 0 && (
              <div className="text-center py-10 text-slate-400 italic text-[13px]">
                No warehouse distribution data available.
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowTransfer(true)}
            className="w-full mt-8 glass-pill-button text-[#0284c7] font-semibold py-3.5 rounded-full hover:bg-white/95 transition-all text-[14px] cursor-pointer"
          >
            Initiate Stock Transfer
          </button>
        </section>
      </div>

      {/* Transaction History */}
      <div className="glass-table-container rounded-[32px] overflow-hidden">
        <div className="p-7 sm:p-8 border-b border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/40">
          <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Production & Transaction History</h3>
          <div className="flex items-center gap-4">
            <GlassPillTabs
              options={['All', 'Production', 'Sales', 'Transfers']}
              value={transactionType}
              onChange={(type) => {
                setTransactionType(type);
                fetchHistory(type);
              }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#edeeef]">
              <tr className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Transaction Type</th>
                <th className="px-8 py-5">Batch / Order #</th>
                <th className="px-8 py-5 text-right">Quantity</th>
                <th className="px-8 py-5">Operator / Client</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {loadingHistory ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-neutral-400">Loading history...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-neutral-400">No transactions recorded.</td>
                </tr>
              ) : (
                transactions
                  .slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage)
                  .map((tx, i) => (
                    <tr key={i} className="group hover:bg-slate-50/60 transition-colors">
                      <td className="px-8 py-5 text-[14px] font-bold text-slate-900">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          {tx.category === 'Production' ? (
                            <Factory className="w-4 h-4 text-[#0284c7]" />
                          ) : tx.category === 'Logistics' ? (
                            <Truck className="w-4 h-4 text-purple-500" />
                          ) : (
                            <ShoppingCart className="w-4 h-4 text-amber-500" />
                          )}
                          <span className="text-[14px] font-bold text-slate-900">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[13px] font-mono text-slate-500 uppercase tracking-wider">{tx.reference}</td>
                      <td className={`px-8 py-5 text-right font-black tabular-nums text-[15px] ${tx.qty > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {tx.qty > 0 ? `+${tx.qty}` : tx.qty}
                      </td>
                      <td className="px-8 py-5 text-[14px] font-medium text-slate-600">{tx.operator}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                          tx.status === 'Completed' || tx.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <GlassPagination
          currentPage={historyPage}
          totalPages={Math.ceil(transactions.length / historyPerPage)}
          totalItems={transactions.length}
          itemsPerPage={historyPerPage}
          onPageChange={setHistoryPage}
          itemLabel="transactions"
        />
      </div>

      {/* Track Stock Transfer Modal */}
      <GlassModal
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        maxWidth="max-w-[480px] w-full"
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
            <span className="text-[13px] font-semibold text-slate-800">Track Stock Transfer</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTransfer(false)}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] block">DESTINATION WAREHOUSE</label>
            <div className="relative">
              <GlassSelect 
                value={transfer.toWarehouse}
                onChange={e => setTransfer({...transfer, toWarehouse: e.target.value})}
              >
                <option>Secondary Storage (B-4)</option>
                <option>Regional Hub (North)</option>
                <option>Central WH</option>
                <option>Shop Display</option>
              </GlassSelect>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] block">TRANSFER QUANTITY</label>
            <input 
              type="number" 
              value={transfer.quantity || ''}
              onChange={e => setTransfer({...transfer, quantity: Number(e.target.value)})}
              className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3.5 text-[15px] font-bold text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.03)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
              placeholder="Enter number of units"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={() => setShowTransfer(false)}
              className="px-6 py-2.5 rounded-full bg-white/90 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleTransfer}
              disabled={isTransferring}
              className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="text-[#0284c7] font-bold">✓</span>
              <span>{isTransferring ? 'Processing...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
