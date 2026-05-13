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
  Filter
} from 'lucide-react';
import { useAppContext } from '../store';

export default function Suppliers() {
  const { showToast } = useAppContext();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/suppliers/balances')
      .then(res => res.json())
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

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/purchases" className="hover:text-[#006397] transition-colors">Purchases</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Suppliers</span>
          </nav>
          <h2 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">Supplier Management</h2>
          <p className="text-[16px] text-neutral-500 mt-1">Directory of raw material and component suppliers.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-neutral-200 text-neutral-900 font-bold rounded-lg hover:bg-neutral-50 transition-all text-[14px] shadow-sm"
          >
            <Download className="w-4 h-4 text-neutral-400" />
            Export
          </button>
          <Link to="/suppliers/add" className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 border border-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg transition-all text-[14px]">
            <Plus className="w-4 h-4" />
            Add Supplier
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
           <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Suppliers</p>
           <h3 className="text-[28px] font-bold text-[#162839]">{suppliers.length}</h3>
        </div>
        <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
           <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Outstanding</p>
           <h3 className="text-[28px] font-bold text-red-500">
             ${suppliers.reduce((acc, s) => acc + (s.balance > 0 ? s.balance : 0), 0).toLocaleString()}
           </h3>
        </div>
        <div className="bg-[#162839] p-6 rounded-xl shadow-xl text-white">
           <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1">Active Orders</p>
           <h3 className="text-[28px] font-bold">12</h3>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#f3f4f5] border border-[#edeeef] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1 group w-full">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#006397] transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or company..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[14px] focus:ring-2 focus:ring-[#5cb8fd]/20 focus:border-[#5cb8fd] outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none justify-center items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap flex">
            <Filter className="w-4 h-4 text-neutral-400" />
            Status: All
          </button>
          <button className="flex-1 md:flex-none justify-center items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap flex">
            <Calendar className="w-4 h-4 text-neutral-400" />
            May 2026
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-[#edeeef] flex flex-col md:flex-row justify-end items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-neutral-500 hover:text-[#006397] transition-colors uppercase tracking-widest">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f8f9fa] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                <th className="px-8 py-5">Supplier Details</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Contact</th>
                <th className="px-8 py-5 text-right">Balance Owed</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[14px] divide-y divide-[#edeeef]">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-neutral-400 italic">Loading suppliers...</td></tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-neutral-400 italic">No suppliers found.</td></tr>
              ) : filteredSuppliers.map((s, idx) => (
                <tr key={s.id} className="hover:bg-[#f8f9fa] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-[#006397]/10 group-hover:text-[#006397] transition-all">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#162839] leading-tight">{s.name}</p>
                        <p className="text-[12px] text-neutral-400 mt-0.5">{s.company || 'Private Entity'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-neutral-100 text-[#162839] text-[11px] font-bold rounded-full uppercase tracking-wider">
                      {s.category || 'General'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-[12px] font-medium">{s.email || 'No Email'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-[12px] font-medium">{s.phone || 'No Phone'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-[#162839]">
                    <span className={s.balance > 0 ? "text-red-500" : "text-emerald-600"}>
                      ${Math.abs(s.balance).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <Link to={`/suppliers/ledger/${s.id}`} className="p-2 text-neutral-400 hover:text-[#006397] hover:bg-neutral-100 rounded-lg transition-all">
                        <ExternalLink className="w-4 h-4" />
                       </Link>
                       <button className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                       </button>
                    </div>
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
