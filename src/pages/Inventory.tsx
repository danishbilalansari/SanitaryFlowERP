import { useAppContext } from '../store';
import { formatCurrency } from '../lib/currency';
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, Edit2, 
  Wallet2, AlertTriangle, Truck, 
  ArrowDownLeft, ArrowUpRight,
  ChevronLeft, ChevronRight, History
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ItemImage } from '../components/ItemImage';
import { motion } from 'motion/react';
import { TableSkeletonRows, GlassEmptyState } from '../components/GlassUI';

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
  color?: string;
}

export default function Inventory() {
  const { currency } = useAppContext();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const categories = React.useMemo(() => {
    return Array.from(new Set(inventory.map(item => item.category).filter(Boolean)));
  }, [inventory]);

  const colors = React.useMemo(() => {
    return Array.from(new Set(inventory.map(item => item.color).filter(Boolean)));
  }, [inventory]);

  const filteredInventory = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let result = inventory;
    
    if (query) {
      result = result.filter(item => 
        (item.name || '').toLowerCase().includes(query) ||
        (item.sku || '').toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    if (selectedColor) {
      result = result.filter(item => item.color === selectedColor);
    }
    
    return result;
  }, [inventory, searchQuery, selectedCategory, selectedColor]);

  const totalPages = React.useMemo(() => {
    return Math.ceil(filteredInventory.length / itemsPerPage);
  }, [filteredInventory.length]);

  const currentItems = React.useMemo(() => {
    return filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredInventory, currentPage]);

  const totalValue = React.useMemo(() => {
    return inventory.reduce((acc, item) => acc + (item.price * item.stock), 0);
  }, [inventory]);

  const lowStockCount = React.useMemo(() => {
    return inventory.filter(item => item.stock < item.minStock).length;
  }, [inventory]);

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
    <div className="space-y-6 pb-12">
      {/* Header & Glass Actions Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)]">
        <div className="flex-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-blue-600 font-bold">Inventory</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Inventory Management</h2>
          <p className="text-sm text-slate-600 mt-0.5">Real-time tracking of finished sanitaryware, stock transfers & warehouse levels.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <Link 
            to="/inventory/add"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white text-slate-800 font-semibold rounded-2xl border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all text-xs"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
            <span>Stock In</span>
          </Link>
          <Link 
            to="/inventory/transfer?mode=stock-out"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl border border-white/40 shadow-[0_4px_16px_rgba(10,132,255,0.35)] backdrop-blur-md transition-all text-xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Stock Out</span>
          </Link>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white text-slate-800 font-semibold rounded-2xl border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all text-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <Link 
            to="/inventory/transfer/history"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white text-slate-800 font-semibold rounded-2xl border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all text-xs"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>History</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats in Apple iOS 26 Liquid Glass Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative overflow-hidden p-6 rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_12px_34px_-6px_rgba(15,23,42,0.055),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-between"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-sky-400/20 via-blue-300/15 to-transparent blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3 relative z-10">
            <span className="text-[11px] font-bold text-slate-500 tracking-[0.1em] uppercase">Total Stock Value</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/15 to-blue-400/10 border border-white shadow-[0_4px_12px_rgba(2,132,199,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] text-[#0284c7] flex items-center justify-center">
              <Wallet2 className="w-4.5 h-4.5 stroke-[2]" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-none mb-3 tabular-nums">
              {formatCurrency(totalValue, currency)}
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-sky-50/90 border border-sky-200/70 text-[11.5px] text-[#0284c7] font-semibold shadow-2xs">
              Calculated asset value
            </span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative overflow-hidden p-6 rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_12px_34px_-6px_rgba(225,29,72,0.06),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-between"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-rose-400/22 via-pink-300/15 to-transparent blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3 relative z-10">
            <span className="text-[11px] font-bold text-rose-600 tracking-[0.1em] uppercase">Low Stock Alerts</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/15 to-pink-400/10 border border-white shadow-[0_4px_12px_rgba(225,29,72,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 stroke-[2]" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-none mb-3 tabular-nums">
              {lowStockCount} <span className="text-[13.5px] font-semibold text-slate-500">SKUs below min</span>
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50/90 border border-rose-200/80 text-[11.5px] text-rose-600 font-semibold shadow-2xs">
              Immediate reorder suggested
            </span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative overflow-hidden p-6 rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_12px_34px_-6px_rgba(15,23,42,0.055),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-between"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400/22 via-teal-300/15 to-transparent blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3 relative z-10">
            <span className="text-[11px] font-bold text-slate-500 tracking-[0.1em] uppercase">Active Catalog</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-teal-400/10 border border-white shadow-[0_4px_12px_rgba(6,182,212,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] text-cyan-600 flex items-center justify-center">
              <Truck className="w-4.5 h-4.5 stroke-[2]" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-none mb-3 tabular-nums">
              {inventory.length} <span className="text-[13.5px] font-semibold text-slate-500">Products</span>
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-50/90 border border-cyan-200/70 text-[11.5px] text-cyan-700 font-semibold shadow-2xs">
              Synchronized in real-time
            </span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative overflow-hidden p-6 rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_12px_34px_-6px_rgba(15,23,42,0.055),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-between"
        >
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-indigo-400/25 via-sky-300/20 to-transparent blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.1em]">Warehouse Capacity</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 text-[10.5px] font-bold text-indigo-600">Optimal</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-none tabular-nums mb-3">84%</h3>
            <div className="w-full bg-white/85 border border-white h-2.5 rounded-full p-0.5 overflow-hidden mb-2.5 shadow-inner">
              <div className="bg-gradient-to-r from-indigo-500 via-[#0284c7] to-cyan-400 h-full w-[84%] rounded-full" />
            </div>
            <span className="text-[11.5px] text-slate-500 font-medium">Main facility storage status</span>
          </div>
        </motion.div>
      </div>

      {/* Main Table Section in Apple iOS 26 Liquid Glass */}
      <div className="rounded-[30px] bg-white/[0.68] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_16px_42px_-8px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.025),inset_0_1px_2px_rgba(255,255,255,1)]">
        {/* Search & Filter Glass Bar */}
        <div 
          className="relative z-30 p-5 sm:p-6 border-b border-white/90 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/[0.45] backdrop-blur-2xl rounded-t-[30px]"
          onMouseLeave={() => {
            setShowCategoryMenu(false);
            setShowColorMenu(false);
          }}
        >
          <div>
            <h4 className="text-[17px] font-bold text-slate-900 tracking-tight">Finished Goods Catalog</h4>
            <p className="text-xs text-slate-500 mt-0.5">Browse SKUs, adjust on-hand stock and view details</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto items-stretch sm:items-center relative">
            <div className="relative group w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0284c7] transition-colors pointer-events-none z-10" />
              <input 
                type="text" 
                placeholder="Search by SKU or product name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full text-[13px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryMenu(!showCategoryMenu);
                  setShowColorMenu(false);
                }}
                className="w-full justify-center items-center gap-2 px-4 py-2.5 glass-pill-button text-[13px] font-semibold text-slate-700 whitespace-nowrap flex cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Category: {selectedCategory || 'All'}</span>
              </button>
              {showCategoryMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('');
                      setShowCategoryMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                      selectedCategory === '' ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowCategoryMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                        selectedCategory === cat ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowColorMenu(!showColorMenu);
                  setShowCategoryMenu(false);
                }}
                className="w-full justify-center items-center gap-2 px-4 py-2.5 glass-pill-button text-[13px] font-semibold text-slate-700 whitespace-nowrap flex cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Color: {selectedColor || 'All'}</span>
              </button>
              {showColorMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedColor('');
                      setShowColorMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                      selectedColor === '' ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    All Colors
                  </button>
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        setShowColorMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                        selectedColor === color ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-b-[30px]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em]">
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Color</th>
                <th className="px-6 py-4 text-right">On Hand</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <TableSkeletonRows columns={6} rows={6} />
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <GlassEmptyState
                      isSearch={Boolean(searchQuery || selectedCategory || selectedColor)}
                      title={searchQuery || selectedCategory || selectedColor ? 'No matching inventory items' : 'No inventory items yet'}
                      description={searchQuery || selectedCategory || selectedColor ? 'Try adjusting your search query, category, or color filter.' : 'Add your first sanitaryware product to populate the catalog.'}
                      onReset={(searchQuery || selectedCategory || selectedColor) ? () => { setSearchQuery(''); setSelectedCategory(''); setSelectedColor(''); } : undefined}
                    />
                  </td>
                </tr>
              ) : currentItems.map((item) => (
                <tr 
                  key={item.id} 
                  className="cursor-pointer group"
                  onClick={() => navigate(`/inventory/${item.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-white/95 flex items-center justify-center border border-white overflow-hidden shadow-[0_4px_10px_rgba(15,23,42,0.04)] group-hover:scale-105 transition-transform duration-300">
                        <ItemImage 
                          src={item.image} 
                          name={item.name} 
                          className="w-full h-full object-cover text-xs"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight group-hover:text-[#0284c7] transition-colors">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description || 'Standard sanitaryware specification'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs font-semibold">{item.sku}</td>
                  <td className="px-6 py-4 font-medium text-slate-600 text-xs">{item.category}</td>
                  <td className="px-6 py-4">
                     <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 border border-white text-slate-700 shadow-[0_2px_6px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)]">
                       {item.color || 'Standard'}
                     </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-extrabold tabular-nums transition-colors ${
                    item.stock === 0 ? 'text-slate-300' : 
                    item.stock < item.minStock ? 'text-rose-600' : 
                    'text-slate-900'
                  }`}>
                    {item.stock.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/inventory/edit/${item.id}`);
                      }}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white/80 hover:bg-white border border-white text-slate-500 hover:text-[#0284c7] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all"
                      title="Edit item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/[0.45] backdrop-blur-xl border-t border-white/90 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span> of <span className="text-slate-900 font-bold">{filteredInventory.length}</span> items
            </p>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white bg-white/85 hover:bg-white text-slate-600 disabled:opacity-35 transition-all shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    currentPage === page 
                    ? 'bg-gradient-to-r from-[#0284c7] to-sky-500 text-white shadow-[0_4px_12px_rgba(2,132,199,0.3)]' 
                    : 'bg-white/75 hover:bg-white text-slate-700 border border-white shadow-[0_2px_6px_rgba(15,23,42,0.03)]'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white bg-white/85 hover:bg-white text-slate-600 disabled:opacity-35 transition-all shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
