import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, Edit2, 
  Wallet2, AlertTriangle, Truck, 
  ArrowDownLeft, ArrowUpRight,
  ChevronLeft, ChevronRight, History
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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

export default function Inventory() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/inventory', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => {
        setInventory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching inventory:', err);
        setLoading(false);
      });
  }, []);

  const totalValue = inventory.reduce((acc, item) => acc + (item.price * item.stock), 0);
  const lowStockCount = inventory.filter(item => item.stock < item.minStock).length;

  const handleExport = () => {
    if (!inventory || inventory.length === 0) {
      alert('No inventory data to export.');
      return;
    }

    const filteredInventory = inventory.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const headers = ['SKU', 'Product Name', 'Category', 'Stock', 'Min Stock', 'Price', 'Status', 'Warehouse'];
    const rows = filteredInventory.map(item => [
      item.sku,
      item.name,
      item.category,
      item.stock,
      item.minStock,
      item.price,
      item.status,
      item.warehouse || 'Main'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 px-1">
        <div className="flex-1">
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Inventory</span>
          </nav>
          <h2 className="text-[28px] sm:text-[32px] font-black text-[#001d31] tracking-tight leading-none">Inventory Overview</h2>
          <p className="text-[14px] sm:text-[16px] text-neutral-500 mt-1">Real-time tracking of finished goods and stock movements.</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
          <Link 
            to="/inventory/add"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 border border-[#006397] text-[#006397] font-bold rounded-lg hover:bg-[#e3f2fd] transition-colors text-[13px] sm:text-[14px]"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Stock In
          </Link>
          <Link 
            to="/inventory/transfer?mode=stock-out"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-[#006397] text-white font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm text-[13px] sm:text-[14px]"
          >
            <ArrowUpRight className="w-4 h-4" />
            Stock Out
          </Link>
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-white border border-[#edeeef] text-[#162839] font-bold rounded-lg hover:bg-neutral-50 transition-colors text-[13px] sm:text-[14px] shadow-sm"
          >
            <Download className="w-4 h-4 text-neutral-400" />
            Export
          </button>
          <Link 
            to="/inventory/transfer/history"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-white border border-[#edeeef] text-[#162839] font-bold rounded-lg hover:bg-neutral-50 transition-colors text-[13px] sm:text-[14px] shadow-sm"
          >
            <History className="w-4 h-4 text-neutral-400" />
            History
          </Link>
        </div>
      </div>

      {/* Search Bar only */}
      <div className="bg-[#f3f4f5] border border-[#edeeef] p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#006397] transition-colors" />
          <input 
            type="text" 
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[14px] focus:ring-2 focus:ring-[#5cb8fd]/20 focus:border-[#5cb8fd] outline-none transition-all"
          />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#edeeef] p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#d1e4fb] rounded-lg">
              <Wallet2 className="w-5 h-5 text-[#162839]" />
            </div>
            <span className="text-[13px] text-green-600 font-bold flex items-center gap-1">
              +4.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1">TOTAL STOCK VALUE</p>
            <h3 className="text-[32px] font-bold text-[#162839] tracking-tight">${totalValue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white border border-[#fee2e2] p-6 rounded-xl shadow-sm flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#fee2e2] opacity-20 rounded-bl-full translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
          <div className="mb-4">
            <div className="inline-flex p-2 bg-[#fee2e2] rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1">LOW STOCK ALERTS</p>
            <h3 className="text-[32px] font-bold text-[#162839] tracking-tight">{lowStockCount} <span className="text-[16px] font-normal text-neutral-500">SKUs</span></h3>
          </div>
        </div>

        <div className="bg-white border border-[#edeeef] p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <div className="inline-flex p-2 bg-[#cce5ff] rounded-lg">
              <Truck className="w-5 h-5 text-[#006397]" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1">PENDING TRANSFERS</p>
            <h3 className="text-[32px] font-bold text-[#162839] tracking-tight">08</h3>
          </div>
        </div>

        <div className="bg-[#162839] p-6 rounded-xl shadow-sm flex flex-col justify-between text-white">
          <div>
            <p className="text-[11px] font-bold opacity-70 uppercase tracking-widest mb-1">WAREHOUSE CAPACITY</p>
            <h3 className="text-[24px] font-bold">84%</h3>
            <div className="w-full bg-[#2c3e50] h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#5cb8fd] h-full w-[84%]" />
            </div>
          </div>
          <p className="text-[13px] text-white/70 mt-4 leading-tight">System optimal. {inventory.length} SKUs tracked.</p>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#edeeef] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f3f4f5]/30">
          <div className="flex items-center gap-4">
            <h4 className="text-[20px] font-bold text-[#162839]">Finished Goods Inventory</h4>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f3f4f5] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">On Hand</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[14px] divide-y divide-[#edeeef]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">Loading inventory...</td>
                </tr>
              ) : inventory.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.sku.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">No inventory items found.</td>
                </tr>
              ) : inventory.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.sku.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-[#f8f9fa] transition-colors cursor-pointer"
                  onClick={() => navigate(`/inventory/${item.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#f3f4f5] flex items-center justify-center border border-[#edeeef] overflow-hidden group">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <Plus className="w-6 h-6 text-neutral-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#162839] leading-tight">{item.name}</p>
                        <p className="text-[12px] text-neutral-500 mt-0.5">{item.description || 'No description'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-500 font-mono text-[13px]">{item.sku}</td>
                  <td className="px-6 py-4 font-medium text-neutral-500">{item.category}</td>
                  <td className={`px-6 py-4 text-right font-bold transition-colors ${
                    item.stock === 0 ? 'text-neutral-300' : 
                    item.stock < item.minStock ? 'text-red-600' : 
                    'text-[#162839]'
                  }`}>
                    {item.stock.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 text-neutral-400 hover:text-[#006397] transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
