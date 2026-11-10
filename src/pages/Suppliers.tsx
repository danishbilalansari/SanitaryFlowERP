import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MoreVertical, 
  Download, 
  AlertCircle,
  Truck,
  TrendingDown,
  Building2,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  Calendar,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useAppContext } from '../store';
import { TableSkeletonRows, GlassEmptyState } from '../components/GlassUI';

export default function Suppliers() {
  const { showToast, currency } = useAppContext();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categories = ['All', ...Array.from(new Set(suppliers.map(s => s.category).filter(Boolean)))];

  useEffect(() => {
    fetch('/api/suppliers/balances')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('Non-JSON response from /api/suppliers/balances:', text.substring(0, 500));
          throw new Error('Server returned non-JSON response');
        }
        return res.json();
      })
      .then(data => {
        setSuppliers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to fetch suppliers', 'error');
        setLoading(false);
      });
  }, []);

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const currentItems = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    if (!suppliers || suppliers.length === 0) {
      showToast('No supplier data to export', 'error');
      return;
    }

    const headers = ['Name', 'Company', 'Email', 'Phone', 'Balance', 'City'];
    const rows = filteredSuppliers.map(s => [
      s.name,
      s.company || 'N/A',
      s.email,
      s.phone,
      s.balance,
      s.city || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Suppliers_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Supplier report exported successfully', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/purchases" className="hover:text-[#0284c7] transition-colors">Purchases</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0284c7] font-bold">Suppliers</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">Supplier Management</h2>
          <p className="text-sm text-slate-600">Directory of raw material and component suppliers.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 glass-pill-button text-slate-800 font-semibold text-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <Link to="/suppliers/add" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold shadow-[0_4px_16px_rgba(2,132,199,0.3)] hover:brightness-105 transition-all text-xs">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Supplier</span>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-6">
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5">Total Suppliers</p>
           <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">{suppliers.length}</h3>
        </div>
        <div className="glass-card p-6">
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5">Total Outstanding</p>
           <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-500 tabular-nums">
             {currency}{suppliers.reduce((acc, s) => acc + (s.balance > 0 ? s.balance : 0), 0).toLocaleString()}
           </h3>
        </div>
        <div className="glass-card p-6">
           <p className="text-[#0284c7] text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5">Active Orders</p>
           <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">12</h3>
        </div>
      </div>

      {/* Filter Bar — Apple iOS 26 Liquid Glass Search Toolbar */}
      <div 
        className="glass-search-toolbar relative z-40 flex flex-col md:flex-row gap-3.5 items-center"
        onMouseLeave={() => setShowCategoryMenu(false)}
      >
        <div className="relative flex-1 group w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0284c7] transition-colors pointer-events-none z-10" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by supplier name or company..." 
            className="w-full pl-11 pr-5 py-3 rounded-full text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2.5 w-full md:w-auto relative">
          <div className="relative flex-1 md:flex-none">
            <button
              type="button"
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="w-full justify-center items-center gap-2 px-4 py-3 glass-pill-button text-[13px] font-semibold text-slate-700 whitespace-nowrap flex cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>Category: {categoryFilter}</span>
            </button>
            {showCategoryMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                {categories.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(c);
                      setCurrentPage(1);
                      setShowCategoryMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                      categoryFilter === c ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none justify-center items-center gap-2 px-4 py-3 glass-pill-button text-[13px] font-semibold text-slate-700 whitespace-nowrap flex"
          >
            <Download className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Section in Apple iOS 26 Liquid Glass */}
      <div className="glass-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-4">Supplier Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Balance Owed</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13.5px]">
              {loading ? (
                <TableSkeletonRows columns={5} rows={6} />
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <GlassEmptyState
                      isSearch={Boolean(searchQuery || categoryFilter !== 'All')}
                      title={searchQuery || categoryFilter !== 'All' ? 'No matching suppliers found' : 'No suppliers registered yet'}
                      description="Try clearing your search or category filter to view all registered suppliers."
                      onReset={(searchQuery || categoryFilter !== 'All') ? () => { setSearchQuery(''); setCategoryFilter('All'); } : undefined}
                    />
                  </td>
                </tr>
              ) : currentItems.map((s) => (
                <tr key={s.id} className="group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-sky-50/90 border border-white flex items-center justify-center text-[#0284c7] shadow-2xs transition-all">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{s.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.company || 'Private Entity'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-white/90 border border-white text-slate-700 text-[11px] font-semibold rounded-full shadow-2xs">
                      {s.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium">{s.email || 'No Email'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium tabular-nums">{s.phone || 'No Phone'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold tabular-nums">
                    <span className={s.balance > 0 ? "text-rose-500" : "text-emerald-600"}>
                      {currency}{Math.abs(s.balance).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                       <Link to={`/suppliers/ledger/${s.id}`} className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:text-[#0284c7] bg-white/85 hover:bg-white border border-white rounded-full shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />
                       </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/[0.45] backdrop-blur-xl border-t border-white/90 flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredSuppliers.length)}</span> of <span className="font-bold text-slate-900">{filteredSuppliers.length}</span> suppliers
            </span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white bg-white/85 hover:bg-white text-slate-600 transition-all disabled:opacity-35 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${currentPage === page ? 'bg-gradient-to-r from-[#0284c7] to-sky-500 text-white shadow-[0_4px_12px_rgba(2,132,199,0.3)]' : 'border border-white bg-white/75 hover:bg-white text-slate-700'}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white bg-white/85 hover:bg-white text-slate-600 transition-all disabled:opacity-35 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
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
