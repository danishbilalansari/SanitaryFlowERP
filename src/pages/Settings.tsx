import React, { useState, useEffect, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, 
  Plus, 
  Edit,
  Save, 
  Bell, 
  ShieldAlert, 
  ChevronRight, 
  ShieldCheck, 
  UserPlus, 
  ArrowRight, 
  History, 
  Lock, 
  Factory, 
  BarChart3, 
  Users2, 
  Settings as SettingsIcon, 
  Search, 
  HelpCircle, 
  Lightbulb, 
  Check, 
  X, 
  CreditCard, 
  Cloud, 
  CheckCircle, 
  RotateCw, 
  Database, 
  AlertTriangle, 
  Download, 
  Globe, 
  PlusCircle, 
  ChevronDown, 
  Upload, 
  TrendingUp, 
  UserX, 
  FileText, 
  FilterX, 
  MoreVertical, 
  Calendar, 
  ChevronLeft, 
  RefreshCw as RefreshIcon, 
  ShieldCheck as ShieldIcon, 
  GanttChartSquare, 
  Activity,
  KeyRound,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../store';
import { CURRENCIES } from '../constants';
import { GlassSelect, GlassCapsuleBar } from '../components/GlassUI';
import { cachedJsonFetch, invalidateApiCache } from '../lib/apiCache';

const SecuritySettingsSection = lazy(() => import('../components/SecuritySettingsSection'));
const ResetUserPasswordModal = lazy(() => import('../components/ResetUserPasswordModal'));
const EditUserModal = lazy(() => import('../components/EditUserModal'));
const DeleteUserModal = lazy(() => import('../components/DeleteUserModal'));

interface Role {
  id: string;
  name: string;
  desc: string;
  count: number;
  active: boolean;
  permissions?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role_id: string;
  status: string;
  last_login: string;
  initials: string;
  color: string;
  role_name: string;
}

const ROLES = [
  { 
    id: 'admin',
    name: 'System Administrator', 
    desc: 'Full unrestricted system access', 
    icon: ShieldCheck, 
    active: true,
    color: '#006397'
  },
  { 
    id: 'manager',
    name: 'Factory Manager', 
    desc: 'Production & Inventory control', 
    icon: Factory, 
    active: false,
    color: '#162839'
  },
  { 
    id: 'accountant',
    name: 'Chief Accountant', 
    desc: 'Sales & Financial reporting', 
    icon: CreditCard, 
    active: false,
    color: '#162839'
  },
  { 
    id: 'operator',
    name: 'Shop Operator', 
    desc: 'Retail sales & inventory lookup', 
    icon: Users2, 
    active: false,
    color: '#162839'
  },
  { 
    id: 'viewer',
    name: 'Read-Only Analyst', 
    desc: 'Data viewing across modules', 
    icon: ShieldAlert, 
    active: false,
    color: '#162839'
  },
];

const PERMISSIONS = [
  { module: 'Inventory Management', desc: 'Stock levels, tracking, and SKU management.', icon: PlusCircle }, 
  { module: 'Production Lines', desc: 'Machine schedules, output logs, and maintenance.', icon: Factory },
  { module: 'Sales & Billing', desc: 'Invoice generation and transaction records.', icon: BarChart3 },
  { module: 'CRM & Customer Data', desc: 'Account management and contact details.', icon: Users2 },
  { module: 'Global System Settings', desc: 'API keys, user management, and system logs.', icon: SettingsIcon },
];

export default function Settings() {
  const navigate = useNavigate();
  const { 
    currency, setCurrency, 
    showToast, 
    logoUrl, setLogoUrl,
    companyName, setCompanyName,
    companyAddress, setCompanyAddress,
    companyEmail, setCompanyEmail,
    companyPhone, setCompanyPhone
  } = useAppContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const backupFileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('General');

  const handleSaveGeneral = () => {
    showToast?.('General settings saved!', 'success');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         setLogoUrl(reader.result as string);
         showToast?.('Logo updated!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };
  const [selectedRoleId, setSelectedRoleId] = useState('admin');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);

  // User management & password reset modal states
  const [selectedUserForReset, setSelectedUserForReset] = useState<any | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const formatLastLogin = (dateStr?: string | null) => {
    if (!dateStr) return { primary: 'Never', secondary: '', full: 'No login recorded' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { primary: 'Never', secondary: '', full: 'No login recorded' };
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let primary = '';
    if (diffMins < 2) {
      primary = 'Just now';
    } else if (diffMins < 60) {
      primary = `${diffMins}m ago`;
    } else if (diffHours < 24 && d.getDate() === now.getDate()) {
      primary = `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays <= 1 || (diffHours < 48 && d.getDate() === now.getDate() - 1)) {
      primary = `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      primary = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const secondary = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { primary, secondary, full: d.toLocaleString() };
  };

  // Security Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logModuleFilter, setLogModuleFilter] = useState('All');
  const [logCurrentPage, setLogCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const logsPerPage = 10;

  useEffect(() => {
    if (activeTab !== 'Security Logs') return;
    const fetchLogs = async (isBackground = false) => {
      if (isBackground && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      if (!isBackground) setLogsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: logCurrentPage.toString(),
          limit: logsPerPage.toString(),
          ...(logSearchQuery && { search: logSearchQuery }),
          ...(logModuleFilter !== 'All' && { module: logModuleFilter })
        });
        const res = await fetch(`/api/audit-logs?${queryParams}`);
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setTotalLogs(Number(data.totalCount || 0));
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        if (!isBackground) setLogsLoading(false);
      }
    };

    fetchLogs(false);
    const interval = setInterval(() => fetchLogs(true), 30_000);
    return () => clearInterval(interval);
  }, [activeTab, logCurrentPage, logSearchQuery, logModuleFilter]);

  const totalLogPages = Math.max(1, Math.ceil(totalLogs / logsPerPage));
  const availableLogModules = ['All', 'Inventory', 'Production', 'Security', 'Sales', 'Core', 'Settings', 'Customers', 'Suppliers'];

  // Backups State
  const [backups, setBackups] = useState<any[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  
  // Backup Schedules State
  const [backupSchedules, setBackupSchedules] = useState({
    daily: { enabled: true, time: '04:00 AM' },
    weekly: { enabled: true, time: '02:00 AM' },
    monthly: { enabled: false, time: '12:00 AM' },
  });
  const [retentionDays, setRetentionDays] = useState(90);
  const [showRetentionMenu, setShowRetentionMenu] = useState(false);
  const [openScheduleMenu, setOpenScheduleMenu] = useState<'daily' | 'weekly' | 'monthly' | null>(null);

  const lastSuccessfulBackup = React.useMemo(() => backups.find(b => b.status === 'Successful'), [backups]);

  useEffect(() => {
    if (activeTab !== 'Backup') return;
    const fetchBackups = async () => {
      try {
        const res = await fetch('/api/backups');
        if (!res.ok) throw new Error('Backups fetch failed');
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          setBackups(data);
        } else {
          console.error('Backups response is not JSON');
        }
      } catch (err) {
        console.error('Error fetching backups:', err);
      } finally {
        setBackupsLoading(false);
      }
    };
    fetchBackups();
  }, [activeTab]);

  const handleCreateBackup = async () => {
    if (isCreatingBackup) return;
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/backups', { method: 'POST' });
      const newBackup = await res.json();
      setBackups([newBackup, ...backups]);
    } catch (err) {
      console.error('Failed to create backup:', err);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleBackupAction = async (id: number, action: string) => {
    if (action === 'download') {
      window.open(`/api/backups/${id}/download`);
      return;
    }
    try {
      await fetch(`/api/backups/${id}/action`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (action === 'retry') {
        const res = await fetch('/api/backups');
        const data = await res.json();
        setBackups(data);
      } else if (action === 'restore') {
        alert('Backup restored successfully!');
      }
    } catch (err) {
      console.error(`Failed to ${action} backup:`, err);
    }
  };

  const handleBackupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await fetch('/api/backups/upload', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert('File uploaded and prepared for restore.');
        const backupsRes = await fetch('/api/backups');
        const backupsData = await backupsRes.json();
        setBackups(backupsData);
      }
    } catch (err) {
      console.error('Failed to upload backup:', err);
      alert('Upload failed');
    }
  };

  const fetchSettingsData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        invalidateApiCache('/api/users');
        invalidateApiCache('/api/roles');
      }
      const [usersData, rolesData] = await Promise.all([
        cachedJsonFetch('/api/users', undefined, 30_000),
        cachedJsonFetch('/api/roles', undefined, 60_000)
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error('Failed to fetch settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      showToast?.('User removed successfully', 'success');
      setUserToDelete(null);
      fetchSettingsData();
    } catch (err: any) {
      showToast?.(err.message || 'Failed to delete user', 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  useEffect(() => {
    const currentRole = roles.find(r => r.id === selectedRoleId);
    if (currentRole && currentRole.permissions) {
      try {
        setEditedPermissions(JSON.parse(currentRole.permissions));
      } catch (e) {
        setEditedPermissions([]);
      }
    } else {
      setEditedPermissions([]);
    }
  }, [selectedRoleId, roles]);

  const handleUpdateRole = async () => {
    if (isUpdatingPermissions) return;
    setIsUpdatingPermissions(true);
    try {
      const response = await fetch(`/api/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: editedPermissions }),
      });
      if (response.ok) {
        // Refresh roles
        const rolesRes = await fetch('/api/roles');
        if (!rolesRes.ok) throw new Error('Roles refresh failed');
        const rolesText = await rolesRes.text();
        const rolesData = rolesText ? JSON.parse(rolesText) : [];
        setRoles(rolesData);
      } else {
        alert('Failed to update role permissions');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update role permissions');
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  const handleResetRole = () => {
    const currentRole = roles.find(r => r.id === selectedRoleId);
    if (currentRole && currentRole.permissions) {
      try {
        setEditedPermissions(JSON.parse(currentRole.permissions));
      } catch (e) {
        setEditedPermissions([]);
      }
    }
  };

  const ALL_MODULES = [
    { label: 'Inventory Module', value: 'Inventory' },
    { label: 'Sales & Invoicing', value: 'Sales' },
    { label: 'Production', value: 'Production' },
    { label: 'Purchases', value: 'Purchases' },
    { label: 'Financial Reports', value: 'Reports' },
    { label: 'Customer Database', value: 'Customers' },
    { label: 'System Settings', value: 'Settings' }
  ];

  const handleTogglePermission = (moduleId: string) => {
    setEditedPermissions(prev => 
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    );
  };

  const handleExportAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs?limit=5000'); // Fetch a large batch for CSV
      const data = await res.json();
      const logsToExport = data.logs || [];

      if (logsToExport.length === 0) {
        showToast?.('No logs to export', 'error');
        return;
      }

      const headers = ['Timestamp', 'User', 'Action', 'Module', 'Description'];
      const rows = logsToExport.map((log: any) => [
        new Date(log.timestamp).toLocaleString(),
        log.user || 'System',
        log.action,
        log.module,
        log.details || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `System_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast?.('Logs exported successfully', 'success');
    } catch (err) {
      console.error('Audit log export failed:', err);
      showToast?.('Export failed', 'error');
    }
  };

  const handleSyncNow = async () => {
    showToast?.('Syncing backup state...', 'info');
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      setBackups(data);
      showToast?.('Backup state synchronized', 'success');
    } catch (err) {
      console.error('Sync failed:', err);
      showToast?.('Sync failed', 'error');
    }
  };

  const renderHeader = () => {
    switch (activeTab) {
      case 'Security & Password':
        return (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-[13px] font-medium text-slate-400 mb-2">
                <Link to="/" className="hover:text-[#0284c7] transition-colors">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0284c7] font-bold">Security & Password</span>
              </nav>
              <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-none">Security & Credentials</h1>
              <p className="text-[15px] text-slate-500 mt-2 font-medium">Manage your personal account password, security preferences, and team credentials.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setActiveTab('User Rules')}
                className="px-5 py-2.5 glass-pill-button text-slate-800 font-semibold text-[13px] rounded-full flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
                <span>Access Control</span>
              </button>
              <button 
                onClick={() => navigate('/settings/users/add')}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold text-[13px] rounded-full hover:brightness-105 transition-all flex items-center gap-2 shadow-[0_6px_20px_rgba(2,132,199,0.28)] whitespace-nowrap cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New User</span>
              </button>
            </div>
          </div>
        );
      case 'User Rules':
        return (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-[13px] font-medium text-slate-400 mb-2">
                <Link to="/" className="hover:text-[#0284c7] transition-colors">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0284c7] font-bold">Access Control</span>
              </nav>
              <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-none">Access Control</h1>
              <p className="text-[15px] text-slate-500 mt-2 font-medium">Manage organization roles, permissions, and staff credentials.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleExportAuditLogs}
                className="px-5 py-2.5 glass-pill-button text-slate-800 font-semibold text-[13px] rounded-full flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#0284c7]" />
                <span>Export Audit Log</span>
              </button>
              <button 
                onClick={() => navigate('/settings/users/add')}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold text-[13px] rounded-full hover:brightness-105 transition-all flex items-center gap-2 shadow-[0_6px_20px_rgba(2,132,199,0.28)] whitespace-nowrap cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New User</span>
              </button>
            </div>
          </div>
        );
      case 'Security Logs':
        return (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-slate-400 text-[13px] font-medium mb-2">
                <Link to="/" className="hover:text-[#0284c7] transition-colors">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0284c7] font-bold">Audit Logs</span>
              </nav>
              <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-none">System Audit Logs</h1>
              <p className="text-[15px] text-slate-500 mt-2 font-medium">Real-time monitoring of all administrative actions and system modifications.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link 
                to="/customers/logs"
                className="flex items-center gap-2 px-5 py-2.5 glass-pill-button text-slate-800 font-semibold rounded-full text-[13px] whitespace-nowrap"
              >
                <History className="w-4 h-4 text-[#0284c7]" />
                <span>Audit Logs</span>
              </Link>
              <button 
                onClick={handleExportAuditLogs}
                className="px-5 py-2.5 glass-pill-button text-slate-800 font-semibold text-[13px] rounded-full flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#0284c7]" />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={fetchSettingsData}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold text-[13px] rounded-full hover:brightness-105 transition-all flex items-center gap-2 shadow-[0_6px_20px_rgba(2,132,199,0.28)] whitespace-nowrap cursor-pointer"
              >
                <RefreshIcon className="w-4 h-4" />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>
        );
      case 'Backup':
        return (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-[13px] font-medium text-slate-400 mb-2">
                <Link to="/" className="hover:text-[#0284c7] transition-colors">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0284c7] font-bold">Backup & Restore</span>
              </nav>
              <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-none">Backup & Restore</h1>
              <p className="text-[15px] text-slate-500 mt-2 font-medium">Manage your data integrity and system recovery protocols.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleSyncNow}
                className="px-5 py-2.5 glass-pill-button text-slate-800 font-semibold text-[13px] rounded-full flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-[#0284c7]" />
                <span>Sync Now</span>
              </button>
              <button 
                onClick={handleCreateBackup} 
                disabled={isCreatingBackup}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold text-[13px] rounded-full hover:brightness-105 transition-all flex items-center gap-2 shadow-[0_6px_20px_rgba(2,132,199,0.28)] whitespace-nowrap disabled:opacity-50 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>{isCreatingBackup ? 'Creating...' : 'Create Manual Backup'}</span>
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
              <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#006397] font-bold">Settings</span>
            </nav>
            <h1 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">System Settings</h1>
            <p className="text-[15px] text-neutral-500 mt-2 font-medium">Manage your factory global configuration and operational parameters.</p>
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Security & Password':
        return (
          <SecuritySettingsSection 
            users={users} 
            roles={roles} 
            onReloadUsers={fetchSettingsData} 
          />
        );
      case 'General':
        return (
          <div className="grid grid-cols-12 gap-8">
            <section className="col-span-12 lg:col-span-7 glass-card p-8 rounded-[30px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-white/95 border border-white flex items-center justify-center shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                  <Building2 className="w-5 h-5 text-[#0284c7]" />
                </div>
                <h3 className="text-[20px] font-bold text-slate-900">Company Profile</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Factory/Company Name</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Business Registration ID</label>
                  <input 
                    type="text" 
                    defaultValue="SF-889021-X"
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Official Logo</label>
                  <div className="flex items-center gap-6 p-6 border-2 border-dashed border-slate-200/80 rounded-2xl bg-white/60 group hover:border-[#38bdf8] transition-colors">
                    <div className="w-16 h-16 bg-white/95 p-2 rounded-2xl border border-white flex items-center justify-center shadow-sm">
                       {logoUrl ? (
                         <img src={logoUrl} alt="Logo" className="max-w-full max-h-full" />
                       ) : (
                         <div className="w-10 h-10 border-2 border-[#0284c7] rounded flex items-center justify-center">
                           <div className="w-6 h-6 border-b-2 border-r-2 border-[#0284c7]" />
                         </div>
                       )}
                    </div>
                    <div>
                      <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-5 py-2 glass-pill-button text-[#0284c7] text-[13px] font-semibold rounded-full transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Replace Logo
                      </button>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium italic">Recommended size: 512x512px. PNG or SVG.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Primary Contact Email</label>
                  <input 
                    type="email" 
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Phone Number</label>
                  <input 
                    type="text" 
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Company Address</label>
                  <textarea
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium outline-none transition-all min-h-[90px]"
                    placeholder="Business address shown on invoices"
                  />
                </div>
              </div>
              
              <div className="mt-10 pt-8 border-t border-slate-200/60 flex justify-end">
                <button 
                  onClick={handleSaveGeneral}
                  className="flex items-center gap-2 px-8 py-3 glass-pill-button text-slate-900 text-[14px] font-semibold rounded-full transition-all"
                >
                  <Save className="w-4 h-4 text-[#0284c7]" />
                  Save Changes
                </button>
              </div>
            </section>

            <section className="col-span-12 lg:col-span-5 glass-card p-8 rounded-[30px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-white/95 border border-white flex items-center justify-center shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                  <Globe className="w-5 h-5 text-[#0284c7]" />
                </div>
                <h3 className="text-[20px] font-bold text-slate-900">Regional Settings</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">System Currency</label>
                  <GlassSelect 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code}>{curr.code} ({curr.symbol}) - {curr.name}</option>
                    ))}
                  </GlassSelect>
                </div>

                <div className="pt-6 border-t border-slate-200/60 space-y-6">
                </div>
              </div>
            </section>
          </div>
        );
      case 'User Rules':
        return (
          <div className="grid grid-cols-12 gap-8 items-start relative">
            {/* Left Column: Role Architecture & Permissions */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              {/* Role Architecture — Apple iOS 26 Liquid Glass */}
              <div className="rounded-[30px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 p-7 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,1)] relative overflow-hidden">
                <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-gradient-to-br from-sky-300/25 via-cyan-200/15 to-transparent blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3.5 mb-6 relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500/15 via-cyan-400/10 to-white/95 border border-white shadow-[0_4px_12px_rgba(2,132,199,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center justify-center text-[#0284c7]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-snug">Role Architecture</h3>
                    <p className="text-[12.5px] text-slate-500 font-medium">Select a role to configure permissions</p>
                  </div>
                </div>
                <div className="space-y-3 relative z-10">
                  {roles.map((role) => {
                    const isSelected = selectedRoleId === role.id;
                    return (
                      <div 
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                          isSelected 
                            ? 'bg-gradient-to-r from-sky-50/95 via-white/95 to-indigo-50/80 border-white shadow-[0_8px_24px_-4px_rgba(2,132,199,0.12),inset_0_1px_2px_rgba(255,255,255,1)] ring-1 ring-sky-300/60' 
                            : 'bg-white/60 border-white/90 hover:bg-white/90 shadow-[0_2px_10px_rgba(15,23,42,0.025)]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className={`font-bold text-[14.5px] transition-colors ${isSelected ? 'text-[#0284c7]' : 'text-slate-900 group-hover:text-[#0284c7]'}`}>{role.name}</p>
                            <p className="text-[12px] text-slate-500 font-medium mt-0.5">{role.desc}</p>
                          </div>
                          <span className={`text-[10.5px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border shrink-0 ${
                            isSelected
                              ? 'bg-sky-500/15 text-[#0284c7] border-sky-200/80'
                              : 'bg-white/90 text-slate-600 border-white shadow-2xs'
                          }`}>
                            {role.count} Users
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Role Permissions — Apple iOS 26 Liquid Glass */}
              <div className="rounded-[30px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 p-7 shadow-[0_16px_44px_-8px_rgba(15,23,42,0.065),inset_0_1px_2px_rgba(255,255,255,1)] relative overflow-hidden">
                {/* Soft ambient colorful glass blobs */}
                <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-sky-400/25 via-indigo-400/15 to-transparent blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-gradient-to-tr from-purple-300/20 via-cyan-300/15 to-transparent blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between gap-3 mb-2 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-sky-500/15 to-white/95 border border-white shadow-[0_4px_14px_rgba(2,132,199,0.1),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center justify-center text-[#0284c7]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[19px] font-bold text-slate-900 tracking-tight leading-snug">
                        {roles.find(r => r.id === selectedRoleId)?.name || 'Admin'} Permissions
                      </h3>
                      <p className="text-[12.5px] text-slate-500 font-medium mt-0.5">
                        Configure module visibility and action rights for this role.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 mt-6 relative z-10">
                  {ALL_MODULES.map((module, i) => {
                    const isChecked = editedPermissions.includes(module.value);
                    return (
                      <label 
                        key={i} 
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer group ${
                          isChecked 
                            ? 'bg-gradient-to-r from-sky-50/90 via-white/95 to-indigo-50/75 border-white shadow-[0_4px_14px_rgba(2,132,199,0.06),inset_0_1px_1.5px_rgba(255,255,255,1)]' 
                            : 'bg-white/55 hover:bg-white/85 border-white/80'
                        }`}
                      >
                        <input 
                          type="checkbox"
                          className="hidden" 
                          checked={isChecked}
                          onChange={() => handleTogglePermission(module.value)}
                        />
                        <div className="flex items-center gap-3.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isChecked 
                              ? 'bg-gradient-to-br from-[#0284c7] to-sky-400 text-white shadow-[0_3px_10px_rgba(2,132,199,0.3)] border border-white/60' 
                              : 'bg-white/90 border border-slate-200/90 shadow-inner group-hover:border-sky-300'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <span className={`text-[14px] font-semibold transition-colors ${isChecked ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-800'}`}>
                            {module.label}
                          </span>
                        </div>
                        <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                          isChecked
                            ? 'bg-emerald-50/90 text-emerald-600 border-emerald-200/70'
                            : 'bg-slate-100/70 text-slate-400 border-white'
                        }`}>
                          {isChecked ? 'Allowed' : 'Not Allowed'}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-7 pt-5 border-t border-slate-200/50 flex gap-3 relative z-10">
                  <button 
                    onClick={handleUpdateRole} 
                    disabled={isUpdatingPermissions}
                    className="flex-1 py-3 bg-gradient-to-r from-[#0284c7] to-sky-500 text-white font-semibold rounded-full text-[13.5px] hover:brightness-105 shadow-[0_6px_20px_rgba(2,132,199,0.28)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingPermissions ? 'Updating...' : 'Update Role'}
                  </button>
                  <button 
                    onClick={handleResetRole} 
                    className="flex-1 py-3 glass-pill-button rounded-full text-slate-700 font-semibold text-[13.5px] hover:text-slate-900 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: User Registry & Logs */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              {/* Registered Users Table */}
              <div className="glass-table-container overflow-hidden">
                <div className="p-8 border-b border-slate-200/60 flex justify-between items-center bg-white/40">
                  <h3 className="text-[20px] font-bold text-slate-900">Registered System Users</h3>
                  <span className="bg-white/90 border border-white text-slate-600 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-2xs">
                    Total: {users.length} User{users.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-200/60 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-5">User</th>
                        <th className="px-8 py-5">Designated Role</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Last Login</th>
                        <th className="px-8 py-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {users.map((u, i) => (
                        <tr key={u.id} className="transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[12px] font-bold text-slate-800 ${u.color || 'bg-sky-100/80'}`}>
                                {u.initials || u.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-[14px] font-bold text-slate-900 leading-tight">{u.name}</p>
                                <p className="text-[12px] text-slate-400 font-medium mt-0.5">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="bg-sky-100/80 border border-sky-200/80 text-[#0284c7] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest">
                              {u.role_name}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span className="text-[13px] font-bold text-slate-800">{u.status}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {(() => {
                              const formatted = formatLastLogin(u.last_login);
                              if (formatted.primary === 'Never') {
                                return <span className="text-[13px] font-semibold text-slate-400">Never</span>;
                              }
                              return (
                                <div title={formatted.full} className="flex flex-col">
                                  <span className="text-[13px] font-bold text-slate-800">{formatted.primary}</span>
                                  {formatted.primary.includes('ago') || formatted.primary.includes('Just now') ? (
                                    <span className="text-[11px] text-slate-400 font-medium">{formatted.secondary}</span>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => setSelectedUserForReset(u)}
                                className="w-8 h-8 rounded-full bg-white/85 hover:bg-amber-50 border border-white text-slate-500 hover:text-amber-600 flex items-center justify-center transition-all shadow-2xs"
                                title="Reset User Password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setSelectedUserForEdit(u)}
                                className="w-8 h-8 rounded-full bg-white/85 hover:bg-sky-50 border border-white text-slate-500 hover:text-[#0284c7] flex items-center justify-center transition-all shadow-2xs"
                                title="Edit User Details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setUserToDelete(u)}
                                className="w-8 h-8 rounded-full bg-white/85 hover:bg-red-50 border border-white text-slate-500 hover:text-red-500 flex items-center justify-center transition-all shadow-2xs"
                                title="Delete or Remove User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-white/40 border-t border-slate-200/60 flex justify-between items-center">
                  <span className="text-[12px] text-slate-500 font-medium">Showing {users.length} registered user{users.length === 1 ? '' : 's'}</span>
                  <div className="flex gap-2">
                    <button className="w-9 h-9 rounded-full bg-white/80 border border-white flex items-center justify-center transition-all opacity-50 cursor-not-allowed shadow-2xs">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-9 h-9 rounded-full bg-white/80 border border-white flex items-center justify-center hover:bg-white transition-all shadow-2xs">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Cards — Apple iOS 26 Liquid Glass */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                  className="rounded-[30px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 p-7 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,1)] flex items-center gap-5 relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-emerald-300/25 via-sky-300/20 to-transparent blur-2xl pointer-events-none" />
                  <div className="w-15 h-15 rounded-[22px] bg-gradient-to-br from-sky-500/15 via-emerald-400/10 to-white/95 border-[1.5px] border-white shadow-[0_8px_20px_-4px_rgba(2,132,199,0.14),inset_0_1px_2px_rgba(255,255,255,1)] flex items-center justify-center shrink-0 text-[#0284c7] relative z-10">
                    <ShieldCheck className="w-7 h-7 stroke-[2]" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5">System Health Monitor</p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">Locked</h4>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-700 text-[12px] font-semibold shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        0 Fail Attempts
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                  className="rounded-[30px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 p-7 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,1)] flex items-center gap-5 relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-indigo-300/25 via-purple-300/20 to-transparent blur-2xl pointer-events-none" />
                  <div className="w-15 h-15 rounded-[22px] bg-gradient-to-br from-indigo-500/15 via-purple-400/10 to-white/95 border-[1.5px] border-white shadow-[0_8px_20px_-4px_rgba(99,102,241,0.14),inset_0_1px_2px_rgba(255,255,255,1)] flex items-center justify-center shrink-0 text-indigo-600 relative z-10">
                    <Activity className="w-7 h-7 stroke-[2]" />
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2">Recent Modifications</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-white shadow-2xs">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">Role 'Sales Staff' updated</p>
                        <span className="text-[11px] text-[#0284c7] bg-sky-50/90 border border-sky-100 px-2 py-0.5 rounded-full font-semibold shrink-0">2m ago</span>
                      </div>
                      <div className="flex justify-between items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-white shadow-2xs">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">New user 'Elena Lucas' added</p>
                        <span className="text-[11px] text-slate-500 bg-slate-100/80 border border-white px-2 py-0.5 rounded-full font-semibold shrink-0">1h ago</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Floating FAB for context */}
            <button 
              onClick={() => navigate('/settings/users/add')}
              className="fixed bottom-12 right-12 w-15 h-15 bg-gradient-to-r from-[#0284c7] to-sky-500 text-white rounded-full shadow-[0_10px_28px_rgba(2,132,199,0.35)] border border-white/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 cursor-pointer"
            >
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </button>
          </div>
        );
      case 'Security Logs':
        return (
          <div className="space-y-8">
            {/* Bento Stats Grid — Apple iOS 26 Liquid Glass */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  label: 'Total Entries',
                  value: '128,492',
                  sub: '+12% vs last week',
                  icon: FileText,
                  iconTone: 'text-[#0284c7] bg-gradient-to-br from-sky-500/15 to-cyan-400/10',
                  blobTone: 'from-sky-400/20 via-cyan-300/10',
                  pillTone: 'bg-emerald-50/90 text-emerald-600 border-emerald-200/80',
                  trend: 'up',
                },
                {
                  label: 'Security Alerts',
                  value: '24',
                  sub: 'Active today',
                  icon: ShieldAlert,
                  iconTone: 'text-rose-500 bg-gradient-to-br from-rose-500/15 to-pink-400/10',
                  blobTone: 'from-rose-400/20 via-pink-300/10',
                  pillTone: 'bg-rose-50/90 text-rose-600 border-rose-200/80',
                  trend: 'alert',
                },
                {
                  label: 'Failed Logins',
                  value: '156',
                  sub: 'Last 24 hours',
                  icon: UserX,
                  iconTone: 'text-amber-600 bg-gradient-to-br from-amber-500/15 to-orange-400/10',
                  blobTone: 'from-amber-400/20 via-orange-300/10',
                  pillTone: 'bg-amber-50/90 text-amber-700 border-amber-200/80',
                },
                {
                  label: 'Storage Health',
                  value: '98.2%',
                  progress: 98.2,
                  icon: Database,
                  iconTone: 'text-indigo-600 bg-gradient-to-br from-indigo-500/15 to-sky-400/15',
                  blobTone: 'from-indigo-400/25 via-sky-300/15',
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                  className="p-6 rounded-[28px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_12px_34px_-6px_rgba(15,23,42,0.055),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-between relative overflow-hidden"
                >
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${stat.blobTone} to-transparent blur-2xl pointer-events-none`} />
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{stat.label}</span>
                    <div className={`w-10 h-10 rounded-2xl border border-white shadow-[0_4px_12px_rgba(15,23,42,0.05),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center justify-center ${stat.iconTone}`}>
                      <stat.icon className="w-4.5 h-4.5 stroke-[2]" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[28px] font-extrabold tracking-tight text-slate-900 leading-none tabular-nums">{stat.value}</p>
                    {stat.sub && (
                      <div className="mt-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold border shadow-2xs ${stat.pillTone}`}>
                          {stat.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                          {stat.sub}
                        </span>
                      </div>
                    )}
                    {stat.progress && (
                      <div className="mt-3.5 space-y-2">
                        <GlassCapsuleBar pct={stat.progress} mode="light" height={12} />
                        <p className="text-[11.5px] text-slate-500 font-medium">Optimal cluster capacity</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Filters Section */}
            <div className="glass-table-container overflow-hidden mt-8">
              <div className="p-6 border-b border-slate-200/60 bg-white/40 flex flex-wrap gap-6 items-center">
                <div className="space-y-1.5 flex-1 min-w-[220px]">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Search</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="Search users, actions..." 
                      className="w-full pl-11 pr-4 py-2.5 bg-white/90 border border-white rounded-full text-[13.5px] font-medium text-slate-800 outline-none shadow-[0_2px_10px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] focus:border-[#38bdf8] transition-all"
                      value={logSearchQuery}
                      onChange={(e) => {
                        setLogSearchQuery(e.target.value);
                        setLogCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Module</label>
                  <div className="relative min-w-[180px]">
                    <GlassSelect 
                      className="!rounded-full !py-2.5 !px-5"
                      value={logModuleFilter}
                      onChange={(e) => {
                        setLogModuleFilter(e.target.value);
                        setLogCurrentPage(1);
                      }}
                    >
                      {availableLogModules.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </GlassSelect>
                  </div>
                </div>
                <div className="ml-auto mt-auto pb-1">
                  <button 
                    onClick={async () => {
                      if (confirm('Clear ALL system audit logs permanently?')) {
                        await fetch('/api/audit-logs', { method: 'DELETE' });
                        setAuditLogs([]);
                        setTotalLogs(0);
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-red-50/90 border border-red-200/80 text-red-600 text-[12.5px] font-semibold flex items-center gap-2 hover:bg-red-100/80 transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Table Area */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-5">Timestamp</th>
                      <th className="px-8 py-5">User</th>
                      <th className="px-8 py-5">Action</th>
                      <th className="px-8 py-5">Module</th>
                      <th className="px-8 py-5">Severity</th>
                      <th className="px-8 py-5">Description</th>
                      <th className="px-8 py-5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50">
                    {logsLoading ? (
                      <tr><td colSpan={7} className="px-8 py-12 text-center text-slate-400 font-semibold">Loading logs...</td></tr>
                    ) : auditLogs.length === 0 ? (
                      <tr><td colSpan={7} className="px-8 py-12 text-center text-slate-400 font-semibold">No logs found.</td></tr>
                    ) : auditLogs.map((log, i) => {
                      const d = new Date(log.timestamp);
                      const severity = log.action === 'DELETE' ? 'Critical' : log.action.includes('error') ? 'Warning' : 'Info';
                      
                      return (
                        <tr 
                          key={i} 
                          className="transition-colors group cursor-pointer"
                          onClick={() => setSelectedLog(log)}
                        >
                          <td className="px-8 py-5">
                          <div className="text-[14px] font-bold text-slate-900">{d.toISOString().split('T')[0]}</div>
                          <div className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">{d.toTimeString().split(' ')[0]}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-sky-100/80 border border-sky-200/80 flex items-center justify-center text-[#0284c7] font-bold text-[12px]">
                               {log.user ? log.user.substring(0, 2).toUpperCase() : 'SY'}
                            </div>
                            <div>
                              <div className="text-[14px] font-bold text-slate-900">{log.user || 'System Automation'}</div>
                              <div className="text-[11px] text-slate-400 font-medium">{(log.user || 'system').toLowerCase().replace(' ', '.')}@sanitaryflow.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            log.action === 'DELETE' ? 'bg-red-50/90 text-red-700 border-red-200/80' :
                            log.action === 'UPDATE' ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80' :
                            log.action === 'LOGIN' ? 'bg-purple-50/90 text-purple-700 border-purple-200/80' :
                            'bg-orange-50/90 text-orange-700 border-orange-200/80'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-[14px] font-medium text-slate-600">
                             {log.module === 'Inventory' && <PlusCircle className="w-4 h-4 text-[#0284c7]" />}
                             {log.module === 'Production' && <Factory className="w-4 h-4 text-[#0284c7]" />}
                             {log.module === 'Security' && <ShieldIcon className="w-4 h-4 text-[#0284c7]" />}
                             {log.module === 'Sales' && <CreditCard className="w-4 h-4 text-[#0284c7]" />}
                             {log.module}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-tight border ${
                            severity === 'Critical' ? 'bg-red-50/90 text-red-700 border-red-200/80' :
                            severity === 'Warning' ? 'bg-amber-50/90 text-amber-700 border-amber-200/80' :
                            'bg-sky-50/90 text-[#0284c7] border-sky-200/80'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              severity === 'Critical' ? 'bg-red-600' :
                              severity === 'Warning' ? 'bg-amber-600' :
                              'bg-[#0284c7]'
                            }`} />
                            {severity}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-[14px] text-slate-600 font-medium max-w-[320px] truncate" title={log.details}>
                          {log.details || log.action}
                        </td>
                        <td className="px-8 py-5">
                          <button className="text-slate-400 hover:text-slate-900 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-6 border-t border-slate-200/60 flex justify-between items-center bg-white/40">
                <span className="text-[13px] text-slate-500 font-medium">Showing {totalLogs === 0 ? 0 : ((logCurrentPage - 1) * logsPerPage) + 1} to {Math.min(logCurrentPage * logsPerPage, totalLogs)} of {totalLogs.toLocaleString()} entries</span>
                <div className="flex gap-2">
                  <button 
                    disabled={logCurrentPage === 1}
                    onClick={() => setLogCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="w-9 h-9 flex items-center justify-center border border-white rounded-full bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-all shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {[...Array(Math.min(5, totalLogPages))].map((_, idx) => {
                    let pageNum;
                    if (totalLogPages <= 5) {
                      pageNum = idx + 1;
                    } else if (logCurrentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (logCurrentPage >= totalLogPages - 2) {
                      pageNum = totalLogPages - 4 + idx;
                    } else {
                      pageNum = logCurrentPage - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setLogCurrentPage(pageNum)}
                        className={`w-9 h-9 flex items-center justify-center border rounded-full text-[13px] font-semibold transition-all ${
                          pageNum === logCurrentPage 
                            ? 'border-sky-300 bg-sky-100/90 text-[#0284c7] shadow-2xs' 
                            : 'border-white bg-white/80 hover:bg-white text-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {totalLogPages > 5 && logCurrentPage < totalLogPages - 2 && (
                    <>
                      <span className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold">...</span>
                      <button
                        onClick={() => setLogCurrentPage(totalLogPages)}
                        className="px-4 h-9 flex items-center justify-center border border-white bg-white/80 hover:bg-white rounded-full text-[13px] font-semibold transition-all text-slate-700"
                      >
                        {totalLogPages}
                      </button>
                    </>
                  )}

                  <button 
                    disabled={logCurrentPage === totalLogPages}
                    onClick={() => setLogCurrentPage(prev => Math.min(prev + 1, totalLogPages))}
                    className="w-9 h-9 flex items-center justify-center border border-white rounded-full bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-all shadow-2xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>


          </div>
        );
      case 'Backup':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-12 gap-8">
              {/* Status Card — Apple iOS 26 Liquid Glass */}
              <div className="col-span-12 lg:col-span-4 rounded-[30px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 p-7 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col justify-between overflow-hidden relative">
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-300/25 via-teal-200/15 to-transparent blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50/90 text-emerald-700 text-[11px] font-bold rounded-full uppercase tracking-wider border border-emerald-200/80 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      System Healthy
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-white/90 border border-white shadow-[0_4px_12px_rgba(16,185,129,0.12)] flex items-center justify-center text-emerald-500">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-[20px] font-extrabold text-slate-900 leading-tight">Last Backup {lastSuccessfulBackup ? 'Successful' : 'Unavailable'}</h3>
                  <p className="text-[13.5px] text-slate-500 font-medium mt-1.5">{lastSuccessfulBackup ? `${new Date(lastSuccessfulBackup.date).toLocaleString()} (Scheduled)` : 'No successful backups found'}</p>
                  
                  <div className="mt-7 space-y-2.5">
                    <div className="flex justify-between items-center px-4 py-3 rounded-2xl bg-white/80 border border-white shadow-2xs">
                      <span className="text-[13px] text-slate-500 font-medium">Total Data Size</span>
                      <span className="text-[13.5px] font-bold text-slate-900">{lastSuccessfulBackup ? lastSuccessfulBackup.size : '--'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 rounded-2xl bg-white/80 border border-white shadow-2xs">
                      <span className="text-[13px] text-slate-500 font-medium">Encryption</span>
                      <span className="text-[12.5px] font-bold text-[#0284c7] bg-sky-50/90 border border-sky-200/70 px-2.5 py-0.5 rounded-full">AES-256 Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automated Schedules Config — Apple iOS 26 Liquid Glass */}
              <div 
                className="col-span-12 lg:col-span-8 rounded-[30px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 p-7 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,1)] relative"
                onMouseLeave={() => setOpenScheduleMenu(null)}
              >
                <div className="flex items-center gap-4 mb-7">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/15 via-cyan-400/10 to-white/95 border border-white shadow-[0_4px_14px_rgba(2,132,199,0.1),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center justify-center text-[#0284c7]">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-extrabold text-slate-900 tracking-tight">Automated Schedules</h3>
                    <p className="text-[13.5px] text-slate-500 font-medium">Configure recurring system snapshots with iOS Liquid Glass controls.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Daily */}
                  <div className={`p-5 rounded-[24px] border transition-all relative ${
                    backupSchedules.daily.enabled 
                      ? 'bg-gradient-to-b from-white/90 to-sky-50/45 border-white shadow-[0_8px_24px_-4px_rgba(2,132,199,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)]' 
                      : 'bg-white/45 border-white/70 opacity-75'
                  }`}>
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-[0.1em]">Daily Backup</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={backupSchedules.daily.enabled}
                        onClick={() => setBackupSchedules(prev => ({...prev, daily: {...prev.daily, enabled: !prev.daily.enabled}}))}
                        className={`w-[50px] h-[28px] rounded-full p-[3px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer border relative ${
                          backupSchedules.daily.enabled 
                            ? 'bg-gradient-to-r from-[#0284c7] via-sky-400 to-cyan-400 border-white/80 shadow-[0_4px_12px_rgba(2,132,199,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.45)]' 
                            : 'bg-slate-200/80 border-white/90 shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)]'
                        }`}
                      >
                        <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-[0_2px_6px_rgba(15,23,42,0.2),inset_0_1px_1px_rgba(255,255,255,1)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          backupSchedules.daily.enabled ? 'translate-x-[22px]' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12.5px] font-medium text-slate-500">Every day at:</p>
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!backupSchedules.daily.enabled}
                          onClick={() => setOpenScheduleMenu(openScheduleMenu === 'daily' ? null : 'daily')}
                          className={`w-full h-10 rounded-full px-4 text-[13px] font-semibold flex items-center justify-between border transition-all ${
                            backupSchedules.daily.enabled
                              ? 'glass-pill-button text-slate-800 cursor-pointer'
                              : 'bg-white/50 border-white text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>{backupSchedules.daily.time}</span>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>
                        {openScheduleMenu === 'daily' && backupSchedules.daily.enabled && (
                          <div className="absolute top-full left-0 mt-2 w-full rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] z-50 p-1.5">
                            {['04:00 AM', '12:00 AM', '08:00 PM'].map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setBackupSchedules(prev => ({...prev, daily: {...prev.daily, time: t}}));
                                  setOpenScheduleMenu(null);
                                }}
                                className={`w-full text-left px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                                  backupSchedules.daily.time === t ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weekly */}
                  <div className={`p-5 rounded-[24px] border transition-all relative ${
                    backupSchedules.weekly.enabled 
                      ? 'bg-gradient-to-b from-white/90 to-sky-50/45 border-white shadow-[0_8px_24px_-4px_rgba(2,132,199,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)]' 
                      : 'bg-white/45 border-white/70 opacity-75'
                  }`}>
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-[0.1em]">Weekly Snapshot</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={backupSchedules.weekly.enabled}
                        onClick={() => setBackupSchedules(prev => ({...prev, weekly: {...prev.weekly, enabled: !prev.weekly.enabled}}))}
                        className={`w-[50px] h-[28px] rounded-full p-[3px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer border relative ${
                          backupSchedules.weekly.enabled 
                            ? 'bg-gradient-to-r from-[#0284c7] via-sky-400 to-cyan-400 border-white/80 shadow-[0_4px_12px_rgba(2,132,199,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.45)]' 
                            : 'bg-slate-200/80 border-white/90 shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)]'
                        }`}
                      >
                        <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-[0_2px_6px_rgba(15,23,42,0.2),inset_0_1px_1px_rgba(255,255,255,1)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          backupSchedules.weekly.enabled ? 'translate-x-[22px]' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12.5px] font-medium text-slate-500">Every Sunday at:</p>
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!backupSchedules.weekly.enabled}
                          onClick={() => setOpenScheduleMenu(openScheduleMenu === 'weekly' ? null : 'weekly')}
                          className={`w-full h-10 rounded-full px-4 text-[13px] font-semibold flex items-center justify-between border transition-all ${
                            backupSchedules.weekly.enabled
                              ? 'glass-pill-button text-slate-800 cursor-pointer'
                              : 'bg-white/50 border-white text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>{backupSchedules.weekly.time}</span>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>
                        {openScheduleMenu === 'weekly' && backupSchedules.weekly.enabled && (
                          <div className="absolute top-full left-0 mt-2 w-full rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] z-50 p-1.5">
                            {['02:00 AM', '03:00 AM'].map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setBackupSchedules(prev => ({...prev, weekly: {...prev.weekly, time: t}}));
                                  setOpenScheduleMenu(null);
                                }}
                                className={`w-full text-left px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                                  backupSchedules.weekly.time === t ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Monthly Archive */}
                  <div className={`p-5 rounded-[24px] border transition-all relative ${
                    backupSchedules.monthly.enabled 
                      ? 'bg-gradient-to-b from-white/90 to-sky-50/45 border-white shadow-[0_8px_24px_-4px_rgba(2,132,199,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)]' 
                      : 'bg-white/45 border-white/70 opacity-75'
                  }`}>
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-[0.1em]">Monthly Archive</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={backupSchedules.monthly.enabled}
                        onClick={() => setBackupSchedules(prev => ({...prev, monthly: {...prev.monthly, enabled: !prev.monthly.enabled}}))}
                        className={`w-[50px] h-[28px] rounded-full p-[3px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer border relative ${
                          backupSchedules.monthly.enabled 
                            ? 'bg-gradient-to-r from-[#0284c7] via-sky-400 to-cyan-400 border-white/80 shadow-[0_4px_12px_rgba(2,132,199,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.45)]' 
                            : 'bg-slate-200/80 border-white/90 shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)]'
                        }`}
                      >
                        <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-[0_2px_6px_rgba(15,23,42,0.2),inset_0_1px_1px_rgba(255,255,255,1)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          backupSchedules.monthly.enabled ? 'translate-x-[22px]' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12.5px] font-medium text-slate-500">Last day of month:</p>
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!backupSchedules.monthly.enabled}
                          onClick={() => setOpenScheduleMenu(openScheduleMenu === 'monthly' ? null : 'monthly')}
                          className={`w-full h-10 rounded-full px-4 text-[13px] font-semibold flex items-center justify-between border transition-all ${
                            backupSchedules.monthly.enabled
                              ? 'glass-pill-button text-slate-800 cursor-pointer'
                              : 'bg-white/50 border-white text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>{backupSchedules.monthly.time}</span>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>
                        {openScheduleMenu === 'monthly' && backupSchedules.monthly.enabled && (
                          <div className="absolute top-full left-0 mt-2 w-full rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] z-50 p-1.5">
                            {['12:00 AM', '11:59 PM'].map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setBackupSchedules(prev => ({...prev, monthly: {...prev.monthly, time: t}}));
                                  setOpenScheduleMenu(null);
                                }}
                                className={`w-full text-left px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                                  backupSchedules.monthly.time === t ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backup History Table */}
              <div className="col-span-12 glass-table-container overflow-hidden">
                <div className="p-8 border-b border-slate-200/60 bg-white/40 flex items-center justify-between">
                  <h3 className="text-[20px] font-bold text-slate-900">Backup History</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] text-slate-500 font-medium">Show:</span>
                    <div className="relative min-w-[160px]">
                      <GlassSelect className="!rounded-full !py-2 !px-4 !text-[13px]">
                        <option>Last 30 days</option>
                        <option>Last 6 months</option>
                      </GlassSelect>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                        <th className="px-8 py-5">Date/Time</th>
                        <th className="px-8 py-5">File Name</th>
                        <th className="px-8 py-5">Size</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px] divide-y divide-slate-200/50">
                      {backupsLoading ? (
                        <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-semibold">Loading backups...</td></tr>
                      ) : backups.length === 0 ? (
                        <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-semibold">No backups found.</td></tr>
                      ) : backups.map((backup, i) => (
                        <tr key={i} className="transition-colors">
                          <td className="px-8 py-6 text-slate-500 font-medium">{new Date(backup.date).toLocaleString()}</td>
                          <td className="px-8 py-6 font-bold text-slate-900">{backup.name}</td>
                          <td className="px-8 py-6 text-slate-500 font-medium">{backup.size}</td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                              backup.status === 'Successful' 
                                ? 'bg-emerald-50/90 text-emerald-600 border-emerald-200/80' 
                                : 'bg-red-50/90 text-red-600 border-red-200/80'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${backup.status === 'Successful' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {backup.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right whitespace-nowrap">
                              {backup.status !== 'Failed' ? (
                                <>
                                  <button onClick={() => handleBackupAction(backup.id, 'download')} className="text-[#0284c7] font-semibold text-[13px] hover:underline focus:outline-none">Download</button>
                                  <span className="text-slate-300 mx-3">|</span>
                                  <button onClick={() => handleBackupAction(backup.id, 'restore')} className="text-[#0284c7] font-semibold text-[13px] hover:underline focus:outline-none">Restore</button>
                                </>
                              ) : (
                                <button onClick={() => handleBackupAction(backup.id, 'retry')} className="text-[#0284c7] font-semibold text-[13px] hover:underline focus:outline-none">Retry Backup</button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Restore Section — Apple iOS 26 Liquid Glass */}
              <div className="col-span-12 lg:col-span-8 rounded-[30px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 p-8 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,1)]">
                <h3 className="text-[20px] font-extrabold text-slate-900 mb-6">Restore from Local File</h3>
                <div onClick={() => backupFileInputRef.current?.click()} className="border-2 border-dashed border-sky-200/90 hover:border-[#0284c7] rounded-[28px] p-12 flex flex-col items-center justify-center text-center bg-white/60 hover:bg-white/85 transition-all cursor-pointer relative group shadow-inner">
                  <input type="file" ref={backupFileInputRef} className="hidden" onChange={handleBackupUpload} accept=".gz,.sql,.zip" />
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-500/15 to-cyan-400/10 border border-white rounded-2xl shadow-[0_8px_20px_rgba(2,132,199,0.12)] text-[#0284c7] flex items-center justify-center group-hover:scale-105 transition-transform mb-5">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-[17px] font-bold text-slate-900">Drag and drop backup file (.gz, .sql, .zip)</p>
                  <p className="text-[13.5px] text-slate-500 font-medium mt-1.5">or click to browse from your computer</p>
                </div>

                {/* Overwrite Warning */}
                <div className="mt-6 p-5 bg-rose-50/85 border border-rose-200/80 rounded-2xl flex gap-4 items-start shadow-2xs">
                  <div className="w-11 h-11 bg-white/95 rounded-2xl text-rose-500 shadow-2xs border border-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-rose-900 leading-none mt-0.5">Data Overwrite Warning</p>
                    <p className="text-[13px] text-rose-700/90 font-medium leading-relaxed">
                      Restoring a backup will completely overwrite your current live production database. This action cannot be undone. It is strongly recommended to create a manual backup of your current state before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar Cards — Retention Policy in Apple iOS 26 Liquid Glass */}
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <div 
                  className="rounded-[30px] bg-white/[0.74] backdrop-blur-3xl border-[1.5px] border-white/95 p-7 shadow-[0_16px_44px_-8px_rgba(15,23,42,0.065),inset_0_1px_2px_rgba(255,255,255,1)] relative overflow-hidden"
                  onMouseLeave={() => setShowRetentionMenu(false)}
                >
                  {/* Soft colorful ambient glass glow blobs */}
                  <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-gradient-to-br from-sky-400/25 via-indigo-400/15 to-transparent blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-14 -left-14 w-44 h-44 rounded-full bg-gradient-to-tr from-cyan-300/20 via-purple-300/15 to-transparent blur-2xl pointer-events-none" />

                  <div className="flex items-center gap-3.5 mb-6 relative z-10">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500/15 via-indigo-500/15 to-white/95 border border-white shadow-[0_4px_14px_rgba(2,132,199,0.1),inset_0_1px_1.5px_rgba(255,255,255,1)] text-[#0284c7] flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-extrabold text-slate-900 tracking-tight leading-snug">Retention Policy</h3>
                      <p className="text-[12px] text-slate-500 font-medium">Automated lifecycle & encryption</p>
                    </div>
                  </div>

                  <ul className="space-y-3.5 relative z-10">
                    <li className="p-4 rounded-2xl bg-white/80 border border-white shadow-[0_4px_14px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/12 border border-white text-[#0284c7] flex items-center justify-center shrink-0 mt-0.5">
                        <History className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] leading-relaxed font-medium text-slate-600">
                          Standard backups are retained before automatic deletion for:
                        </p>
                        <div className="mt-2.5 relative w-40">
                          <button
                            type="button"
                            onClick={() => setShowRetentionMenu(!showRetentionMenu)}
                            className="w-full h-10 glass-pill-button rounded-full px-4 text-[13px] font-bold text-slate-900 flex items-center justify-between cursor-pointer"
                          >
                            <span>{retentionDays === 365 ? '1 Year' : `${retentionDays} days`}</span>
                            <ChevronDown className="w-4 h-4 text-[#0284c7]" />
                          </button>
                          {showRetentionMenu && (
                            <div className="absolute top-full left-0 mt-2 w-44 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] z-50 overflow-hidden p-1.5">
                              {[
                                { label: '30 days', value: 30 },
                                { label: '60 days', value: 60 },
                                { label: '90 days', value: 90 },
                                { label: '180 days', value: 180 },
                                { label: '1 Year', value: 365 },
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setRetentionDays(opt.value);
                                    setShowRetentionMenu(false);
                                  }}
                                  className={`w-full text-left px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                                    retentionDays === opt.value ? 'text-[#0284c7] bg-sky-50/90' : 'text-slate-700 hover:bg-slate-100/70'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>

                    <li className="p-4 rounded-2xl bg-white/80 border border-white shadow-[0_4px_14px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/12 border border-white text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <p className="text-[13px] leading-relaxed font-medium text-slate-600">
                        All backup files are encrypted using <strong className="text-slate-900 font-bold">AES-256</strong> at rest and in transit.
                      </p>
                    </li>

                    <li className="p-4 rounded-2xl bg-white/80 border border-white shadow-[0_4px_14px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/12 border border-white text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Globe className="w-4 h-4" />
                      </div>
                      <p className="text-[13px] leading-relaxed font-medium text-slate-600">
                        Redundant copies are kept across <strong className="text-slate-900 font-bold">3 geographical zones</strong> for disaster recovery.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <SettingsIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-[14px] font-medium italic">Content for {activeTab} is being updated...</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 overflow-x-hidden">
      {/* Dynamic Header */}
      {renderHeader()}

      {/* Tabs Navigation */}
      <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-white/60 backdrop-blur-2xl border border-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,1)]">
        {['General', 'Security & Password', 'User Rules', 'Security Logs', 'Backup'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-[13.5px] font-semibold transition-all relative cursor-pointer ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense fallback={<div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#0284c7]" /></div>}>
            {renderContent()}
          </Suspense>
        </motion.div>
      </AnimatePresence>

      <Suspense fallback={null}>
        {/* Admin Reset User Password Modal */}
        {selectedUserForReset && (
          <ResetUserPasswordModal
            isOpen={Boolean(selectedUserForReset)}
            onClose={() => setSelectedUserForReset(null)}
            user={selectedUserForReset}
            onSuccess={() => fetchSettingsData(true)}
          />
        )}

        {/* Admin Edit User Modal */}
        {selectedUserForEdit && (
          <EditUserModal
            isOpen={Boolean(selectedUserForEdit)}
            onClose={() => setSelectedUserForEdit(null)}
            user={selectedUserForEdit}
            roles={roles}
            onSuccess={() => fetchSettingsData(true)}
          />
        )}

        {/* Delete User Confirmation Modal */}
        {userToDelete && (
          <DeleteUserModal
            isOpen={Boolean(userToDelete)}
            onClose={() => setUserToDelete(null)}
            user={userToDelete}
            onConfirm={handleDeleteUser}
            loading={isDeletingUser}
          />
        )}
      </Suspense>

      {/* Log Detail Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedLog && (
            <div 
              id="security-log-modal-backdrop"
              className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedLog(null);
              }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                className="rounded-[32px] bg-white/[0.80] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.12),inset_0_1px_2px_rgba(255,255,255,1)] w-full max-w-2xl p-6 sm:p-7 overflow-hidden relative z-10 m-auto"
              >
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span className="text-[13px] font-semibold text-slate-800">
                      Security Event · #{selectedLog.id}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl bg-white/90 border border-white p-3.5 shadow-2xs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event ID</p>
                      <p className="text-[13.5px] font-bold text-slate-900 mt-0.5">#{selectedLog.id}</p>
                    </div>
                    <div className="rounded-2xl bg-white/90 border border-white p-3.5 shadow-2xs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp</p>
                      <p className="text-[12.5px] font-bold text-slate-900 mt-0.5 truncate">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-white/90 border border-white p-3.5 shadow-2xs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acting User</p>
                      <p className="text-[13.5px] font-bold text-slate-900 mt-0.5">{selectedLog.user || 'System'}</p>
                    </div>
                    <div className="rounded-2xl bg-white/90 border border-white p-3.5 shadow-2xs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module</p>
                      <p className="text-[13.5px] font-bold text-[#0284c7] mt-0.5">{selectedLog.module}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/90 border border-white p-4 shadow-2xs">
                    <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action Performed</p>
                    <code className="text-slate-900 font-bold text-[14px]">{selectedLog.action}</code>
                  </div>

                  <div className="rounded-2xl bg-white/90 border border-white p-4 shadow-2xs">
                    <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">Log Data (JSON)</p>
                    <div className="bg-slate-900/95 p-4 rounded-xl overflow-x-auto">
                      <pre className="text-[12px] text-sky-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details || '{}') : selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="pt-5 flex justify-end">
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-[#0284c7] stroke-[2.5]" />
                    <span>Done</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
