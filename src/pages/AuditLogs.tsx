import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, History, Search, Filter, Download } from 'lucide-react';
import { useAppContext } from '../store';
import { TableSkeletonRows, GlassEmptyState } from '../components/GlassUI';

interface AuditLog {
  id: number;
  user: string;
  action: string;
  module: string;
  timestamp: string;
  details: string;
}

export default function AuditLogs() {
  const { showToast } = useAppContext();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 10;

  useEffect(() => {
    const fetchLogs = async (isBackground = false) => {
      if (isBackground && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      if (!isBackground) setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: logsPerPage.toString(),
          ...(searchQuery && { search: searchQuery }),
          ...(moduleFilter !== 'All' && { module: moduleFilter })
        });
        const res = await fetch(`/api/audit-logs?${queryParams}`);
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalLogs(Number(data.totalCount || 0));
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchLogs(false);
    const interval = setInterval(() => fetchLogs(true), 30_000);
    return () => clearInterval(interval);
  }, [currentPage, searchQuery, moduleFilter]);

  const handleExport = async () => {
    try {
      const res = await fetch('/api/audit-logs?limit=1000'); // Fetch more for export
      const data = await res.json();
      const allLogs = data.logs || [];

      if (allLogs.length === 0) {
        showToast?.('No logs to export', 'error');
        return;
      }

      const headers = ['Timestamp', 'User', 'Action', 'Module', 'Details'];
      const rows = allLogs.map((log: AuditLog) => [
        new Date(log.timestamp).toLocaleString(),
        log.user,
        log.action,
        log.module,
        log.details
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast?.('Audit logs exported successfully', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast?.('Export failed', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalLogs / logsPerPage));
  const availableModules = ['All', 'Inventory', 'Production', 'Security', 'Sales', 'Customers', 'Suppliers']; // Simplified list for now based on screenshot

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.65] backdrop-blur-2xl border border-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/" className="hover:text-[#0284c7] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0284c7] font-bold">Audit Logs</span>
          </nav>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">System Audit Logs</h2>
          <p className="text-sm text-slate-600">Track every action across the ERP system for security and accountability.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 glass-pill-button text-slate-800 font-semibold text-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div 
        className="glass-search-toolbar relative z-40 flex flex-col md:flex-row gap-3.5 items-center"
        onMouseLeave={() => setShowModuleMenu(false)}
      >
        <div className="relative flex-1 group w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0284c7] transition-colors pointer-events-none z-10" />
          <input 
            type="text" 
            placeholder="Search logs by user, action, or module..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-5 py-3 rounded-full text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2.5 w-full md:w-auto relative">
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to clear all audit logs?')) {
                await fetch('/api/audit-logs', { method: 'DELETE' });
                setLogs([]);
                setTotalLogs(0);
              }
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-rose-50/90 hover:bg-rose-100/90 border border-rose-200/80 text-[13px] font-semibold text-rose-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            Clear All Logs
          </button>
          <div className="relative flex-1 md:flex-none">
            <button
              type="button"
              onClick={() => setShowModuleMenu(!showModuleMenu)}
              className="w-full justify-center items-center gap-2 px-4 py-3 glass-pill-button text-[13px] font-semibold text-slate-700 whitespace-nowrap flex cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>Module: {moduleFilter}</span>
            </button>
            {showModuleMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                {availableModules.map(module => (
                  <button
                    key={module}
                    type="button"
                    onClick={() => {
                      setModuleFilter(module);
                      setCurrentPage(1);
                      setShowModuleMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                      moduleFilter === module ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    {module}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {loading ? (
                <TableSkeletonRows columns={5} rows={6} />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <GlassEmptyState
                      isSearch={Boolean(searchQuery || moduleFilter !== 'All')}
                      title={searchQuery || moduleFilter !== 'All' ? 'No matching audit logs' : 'No audit logs recorded'}
                      description="System activity across inventory, production, sales, and security will appear here."
                      onReset={(searchQuery || moduleFilter !== 'All') ? () => { setSearchQuery(''); setModuleFilter('All'); } : undefined}
                    />
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs tabular-nums">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{log.user}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-sky-50/90 border border-sky-200/80 text-[#0284c7] rounded-full text-[11px] font-semibold uppercase tracking-wider">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600">{log.module}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/[0.45] backdrop-blur-xl border-t border-white/90 flex justify-center items-center gap-3">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 glass-pill-button text-xs font-semibold text-[#0284c7] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-600">Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong></span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 glass-pill-button text-xs font-semibold text-[#0284c7] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
