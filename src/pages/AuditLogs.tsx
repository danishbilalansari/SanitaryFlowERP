import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, History, Search, Filter, Download } from 'lucide-react';
import { useAppContext } from '../store';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: logsPerPage.toString(),
          ...(searchQuery && { search: searchQuery }),
          ...(moduleFilter !== 'All' && { module: moduleFilter })
        });
        const res = await fetch(`/api/audit-logs?${queryParams}`, { cache: 'no-cache' });
        const data = await res.json();
        setLogs(data.logs);
        setTotalLogs(Number(data.totalCount));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Audit Logs</span>
          </nav>
          <h2 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">System Audit Logs</h2>
          <p className="text-[16px] text-neutral-500 mt-1">Track every action across the ERP system for security and accountability.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#edeeef] text-[#162839] font-bold rounded-lg hover:bg-neutral-50 transition-all text-[14px] shadow-sm uppercase tracking-widest text-[11px]"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-[#f3f4f5] border border-[#edeeef] p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#006397] transition-colors" />
          <input 
            type="text" 
            placeholder="Search logs by user, action, or module..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[14px] focus:ring-2 focus:ring-[#5cb8fd]/20 focus:border-[#5cb8fd] outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to clear all audit logs?')) {
                await fetch('/api/audit-logs', { method: 'DELETE' });
                setLogs([]);
                setTotalLogs(0);
              }
            }}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-red-200 rounded-lg text-[13px] font-bold text-red-600 hover:bg-neutral-50 transition-colors outline-none cursor-pointer"
          >
            Clear All Logs
          </button>
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors outline-none cursor-pointer"
          >
            {availableModules.map(module => <option key={module} value={module}>{module}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f3f4f5] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-[#edeeef]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">Loading logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">No logs found.</td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f8f9fa] transition-colors">
                  <td className="px-6 py-4 text-neutral-500 whitespace-nowrap text-[12px]">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-[#162839]">{log.user}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-[11px] font-bold uppercase tracking-wider">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-neutral-500">{log.module}</td>
                  <td className="px-6 py-4 text-neutral-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#edeeef] flex justify-center items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-white border border-[#edeeef] rounded-lg text-sm font-bold text-[#006397] hover:bg-neutral-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-bold text-neutral-600">Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-white border border-[#edeeef] rounded-lg text-sm font-bold text-[#006397] hover:bg-neutral-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
