import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Bell, 
  HelpCircle, 
  Edit, 
  Settings2, 
  History, 
  ShoppingCart, 
  Factory, 
  Truck,
  ChevronDown, 
  Filter,
  Settings,
  MoreVertical,
  Package,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';

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
  warehouse?: string;
  image?: string;
}

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
    const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30D');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionType, setTransactionType] = useState('All');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [isFullHistory, setIsFullHistory] = useState(false);

  const fetchDistribution = () => {
    fetch(`/api/inventory/${id}/distribution`)
      .then(async res => {
        if (!res.ok) throw new Error('Distribution fetch failed');
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => setDistribution(data))
      .catch(err => console.error(err));
  };

  const fetchHistory = (type: string, limit: number | null = 5) => {
    setLoadingHistory(true);
    const url = `/api/inventory/${id}/transactions?type=${type}${limit ? `&limit=${limit}` : ''}`;
    fetch(url)
      .then(async res => {
        if (!res.ok) throw new Error('History fetch failed');
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => {
        setTransactions(data);
        setLoadingHistory(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingHistory(false);
      });
  };

  useEffect(() => {
    fetch(`/api/inventory/${id}`)
      .then(async res => {
        if (!res.ok) throw new Error('Item fetch failed');
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then(data => {
        setItem(data);
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
    fetch(`/api/inventory/${id}/trends?range=${timeRange}`)
      .then(async res => {
        if (!res.ok) throw new Error('Trends fetch failed');
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => setTrendData(data))
      .catch(err => console.error(err));
  }, [id, timeRange]);

  const [showAdjust, setShowAdjust] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [adjustment, setAdjustment] = useState({ type: 'add', quantity: 0, reason: '' });
  const [transfer, setTransfer] = useState({ toWarehouse: 'Secondary Storage (B-4)', quantity: 0 });

  const handleAdjust = async () => {
    if (adjustment.quantity <= 0) return;
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item?.id, ...adjustment })
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (item) setItem({ ...item, stock: data.newStock });
        setShowAdjust(false);
        fetchHistory(transactionType);
      }
    } catch (err) {
      console.error('Adjustment failed:', err);
    }
  };

  const handleTransfer = async () => {
    if (transfer.quantity <= 0) return;
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
        setShowTransfer(false);
        fetchHistory(transactionType);
        fetchDistribution();
        // Refresh item main stock too
        fetch(`/api/inventory/${id}`)
          .then(async r => {
            if (!r.ok) throw new Error('Refresh failed');
            const text = await r.text();
            return text ? JSON.parse(text) : null;
          })
          .then(setItem)
          .catch(err => console.error('Error refreshing item:', err));
      }
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006397]"></div>
      </div>
    );
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
            className="p-3 bg-white border border-[#edeeef] text-[#162839] rounded-xl hover:bg-neutral-50 transition-all shadow-sm"
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
        <div className="flex items-center gap-6">
          <div className="relative group hidden md:block">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              className="pl-10 pr-4 py-2 bg-white border border-[#edeeef] rounded-lg text-[13px] focus:ring-2 focus:ring-[#5cb8fd] outline-none w-64 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4 border-l border-[#edeeef] pl-6">
            <Bell className="w-5 h-5 text-neutral-400 hover:text-[#006397] cursor-pointer transition-colors" />
            <HelpCircle className="w-5 h-5 text-neutral-400 hover:text-[#006397] cursor-pointer transition-colors" />
            <div className="w-10 h-10 rounded-full border border-[#edeeef] overflow-hidden bg-neutral-100 font-bold flex items-center justify-center text-[#162839]">
              AD
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white rounded-2xl border border-[#edeeef] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          <div className="w-48 h-48 bg-[#f8f9fa] rounded-2xl flex items-center justify-center border border-[#edeeef] shrink-0 overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-20 h-20 text-[#162839] opacity-10" />
            )}
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <span className="inline-block bg-[#5cb8fd] text-[#00476e] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                  SKU: {item.sku}
                </span>
                <h1 className="text-[32px] font-black text-[#162839] tracking-tight leading-tight">{item.name}</h1>
                <p className="text-[14px] text-neutral-500 font-medium mt-2 leading-relaxed max-w-xl">
                  {item.description || 'No description available for this SKU.'}
                </p>
              </div>
                <div className="flex gap-2">
                <button 
                  onClick={() => setShowAdjust(true)}
                  className="bg-[#5cb8fd] text-[#00476e] px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2 text-[13px] uppercase tracking-widest"
                >
                  Adjust Stock
                </button>
                <button 
                  onClick={() => navigate(`/inventory/edit/${item.id}`)}
                  className="bg-[#162839] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2 text-[13px] uppercase tracking-widest"
                >
                  <Edit className="w-4 h-4" />
                  Edit Item
                </button>
              </div>
            </div>

            {showAdjust && (
              <div className="mt-6 p-6 bg-neutral-50 rounded-xl border-2 border-dashed border-[#5cb8fd] space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#162839]">Inventory Adjustment</h4>
                  <button onClick={() => setShowAdjust(false)} className="text-neutral-400 hover:text-red-500 font-bold">Cancel</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <select 
                     value={adjustment.type}
                     onChange={e => setAdjustment({...adjustment, type: e.target.value})}
                     className="bg-white border rounded-lg p-2 outline-none font-bold text-[13px]"
                   >
                     <option value="add">Add Stock</option>
                     <option value="subtract">Subtract Stock</option>
                   </select>
                   <input 
                     type="number" 
                     placeholder="Quantity"
                     value={adjustment.quantity || ''}
                     onChange={e => setAdjustment({...adjustment, quantity: Number(e.target.value)})}
                     className="bg-white border rounded-lg p-2 outline-none font-bold text-[13px]"
                   />
                   <input 
                     type="text" 
                     placeholder="Reason (e.g. Damage, Audit)"
                     value={adjustment.reason}
                     onChange={e => setAdjustment({...adjustment, reason: e.target.value})}
                     className="bg-white border rounded-lg p-2 outline-none font-bold text-[13px]"
                   />
                </div>
                <button 
                  onClick={handleAdjust}
                  className="w-full bg-[#162839] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all text-[12px] uppercase tracking-wider"
                >
                  Confirm Adjustment
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-8 mt-10">
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">On Hand</p>
                <p className={`text-[28px] font-black leading-none ${item.stock < item.minStock ? 'text-red-500' : 'text-[#162839]'}`}>
                  {item.stock.toLocaleString()} <span className="text-[14px] font-bold text-neutral-400 ml-1">units</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Safety Stock</p>
                <p className="text-[28px] font-black text-[#006397] leading-none">
                  {item.minStock} <span className="text-[14px] font-bold text-neutral-400 ml-1">units</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Unit Price</p>
                <p className="text-[28px] font-black text-green-600 leading-none">
                  ${(item.price ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#edeeef] p-8 shadow-sm">
          <h3 className="text-[18px] font-bold text-[#162839] border-b border-[#edeeef] pb-4 mb-6">Technical Specs</h3>
          <div className="space-y-4">
            {[
              { label: 'Category', value: item.category },
              { label: 'Warehouse', value: item.warehouse || 'Central WH' },
              { label: 'Status', value: item.stock < item.minStock ? 'LOW STOCK' : 'IN STOCK' }
            ].map((spec, i) => (
              <div key={i} className="flex justify-between items-center text-[13px]">
                <span className="text-neutral-400 font-bold uppercase tracking-widest text-[11px]">{spec.label}</span>
                <span className="font-bold text-[#162839]">{spec.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Dashboard Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Stock Trend */}
        <section className="xl:col-span-2 bg-white rounded-2xl border border-[#edeeef] p-8 shadow-sm flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[18px] font-bold text-[#162839]">Stock Level Trends</h3>
            <div className="flex bg-[#f8f9fa] p-1 rounded-lg border border-[#edeeef]">
              {['7D', '30D', '90D'].map((range) => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-md text-[11px] font-black tracking-widest transition-all ${
                    timeRange === range 
                      ? 'bg-[#006397] text-white shadow-md' 
                      : 'text-neutral-500 hover:text-[#162839]'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006397" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#006397" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a0a0a0', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  hide
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #edeeef', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#006397" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Distribution */}
        <section className="bg-white rounded-2xl border border-[#edeeef] p-8 shadow-sm flex flex-col">
          <h3 className="text-[18px] font-bold text-[#162839] mb-8">Warehouse Distribution</h3>
          <div className="space-y-8 flex-1">
            {distribution.map((dist, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#162839] text-[14px]">{dist.name}</span>
                  <span className="text-[14px] font-black text-[#162839]">{dist.qty} <span className="text-neutral-400 text-[12px] font-bold">units</span></span>
                </div>
                <div className="w-full bg-[#f3f4f5] rounded-full h-2.5 overflow-hidden">
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
              <div className="text-center py-10 text-neutral-400 italic text-[13px]">
                No warehouse distribution data available.
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowTransfer(true)}
            className="w-full mt-10 border-2 border-[#006397] text-[#006397] font-black py-4 rounded-xl hover:bg-[#d3e4fe]/30 transition-all uppercase tracking-widest text-[13px] shadow-sm"
          >
            Initiate Stock Transfer
          </button>
        </section>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-[#edeeef] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#edeeef] flex flex-col md:flex-row justify-between items-center gap-6">
          <h3 className="text-[20px] font-bold text-[#162839]">Production & Transaction History</h3>
          <div className="flex items-center gap-4">
            <div className="flex bg-[#f8f9fa] p-1 rounded-xl border border-[#edeeef]">
              {['All', 'Production', 'Sales', 'Transfers'].map((type) => (
                <button 
                  key={type}
                  onClick={() => {
                    setTransactionType(type);
                    fetchHistory(type, isFullHistory ? null : 5);
                  }}
                  className={`px-6 py-2 rounded-lg text-[12px] font-black tracking-widest transition-all ${
                    transactionType === type 
                      ? 'bg-[#006397] text-white shadow-md' 
                      : 'text-neutral-500 hover:text-[#162839]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
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
              ) : transactions.map((tx, i) => (
                <tr key={i} className="group hover:bg-[#f8f9fa]/50 transition-colors">
                  <td className="px-8 py-6 text-[14px] font-bold text-[#162839]">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      {tx.category === 'Production' ? (
                        <Factory className="w-4 h-4 text-blue-500" />
                      ) : tx.category === 'Logistics' ? (
                        <Truck className="w-4 h-4 text-purple-500" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 text-orange-500" />
                      )}
                      <span className="text-[14px] font-bold text-[#162839]">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[13px] font-medium text-neutral-400 uppercase tracking-wider">{tx.reference}</td>
                  <td className={`px-8 py-6 text-right font-black text-[15px] ${tx.qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.qty}
                  </td>
                  <td className="px-8 py-6 text-[14px] font-medium text-neutral-600">{tx.operator}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${
                      tx.status === 'Completed' || tx.status === 'RECEIVED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isFullHistory && transactions.length >= 5 && (
          <div className="p-6 bg-[#f8f9fa] border-t border-[#edeeef] flex justify-center">
            <button 
              onClick={() => {
                setIsFullHistory(true);
                fetchHistory(transactionType, null);
              }}
              className="flex items-center gap-2 text-[#006397] font-black text-[13px] uppercase tracking-widest hover:underline"
            >
              Load Full Transaction History
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {showTransfer && (
        <div 
          className="fixed inset-0 bg-[#162839]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTransfer(false);
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8 bg-[#f8f9fa] border-b border-[#edeeef]">
              <h3 className="text-[24px] font-black text-[#162839]">Track Stock Transfer</h3>
              <p className="text-[14px] text-neutral-500 mt-1 font-medium">Relocate units between storage locations.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.1em] block">Destination Warehouse</label>
                <div className="relative">
                  <select 
                    value={transfer.toWarehouse}
                    onChange={e => setTransfer({...transfer, toWarehouse: e.target.value})}
                    className="w-full bg-white border border-[#edeeef] rounded-xl px-4 py-4 text-[15px] font-bold text-[#162839] outline-none appearance-none focus:ring-2 focus:ring-[#5cb8fd] transition-all cursor-pointer"
                  >
                    <option>Secondary Storage (B-4)</option>
                    <option>Regional Hub (North)</option>
                    <option>Central WH</option>
                    <option>Shop Display</option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.1em] block">Transfer Quantity</label>
                <input 
                  type="number" 
                  value={transfer.quantity || ''}
                  onChange={e => setTransfer({...transfer, quantity: Number(e.target.value)})}
                  className="w-full bg-white border border-[#edeeef] rounded-xl px-4 py-4 text-[15px] font-bold text-[#162839] outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  placeholder="Enter number of units"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowTransfer(false)}
                  className="flex-1 py-4 border border-[#edeeef] text-neutral-500 font-bold rounded-xl hover:bg-neutral-50 transition-all uppercase tracking-widest text-[12px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleTransfer}
                  className="flex-1 py-4 bg-[#006397] text-white font-bold rounded-xl hover:opacity-90 shadow-lg shadow-blue-900/20 transition-all uppercase tracking-widest text-[12px]"
                >
                  Track Transfer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
