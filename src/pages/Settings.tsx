import React, { useState, useEffect } from 'react';
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
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../store';
import { CURRENCIES } from '../constants';

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
  const { currency, setCurrency, showToast, logoUrl, setLogoUrl } = useAppContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const backupFileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('General');

  const handleSaveGeneral = () => {
    // Save other fields here if needed
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

  // Security Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logModuleFilter, setLogModuleFilter] = useState('All');
  const [logCurrentPage, setLogCurrentPage] = useState(1);
  const logsPerPage = 10;

  useEffect(() => {
    if (activeTab !== 'Security Logs') return;
    const fetchLogs = async () => {
      setLogsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: logCurrentPage.toString(),
          limit: logsPerPage.toString(),
          ...(logSearchQuery && { search: logSearchQuery }),
          ...(logModuleFilter !== 'All' && { module: logModuleFilter })
        });
        const res = await fetch(`/api/audit-logs?${queryParams}`, { cache: 'no-cache' });
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setTotalLogs(Number(data.totalCount || 0));
        setLogsLoading(false);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setLogsLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [activeTab, logCurrentPage, logSearchQuery, logModuleFilter]);

  const totalLogPages = Math.max(1, Math.ceil(totalLogs / logsPerPage));
  const availableLogModules = ['All', 'Inventory', 'Production', 'Security', 'Sales', 'Core', 'Settings'];

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

  const lastSuccessfulBackup = React.useMemo(() => backups.find(b => b.status === 'Successful'), [backups]);

  useEffect(() => {
    if (activeTab !== 'Backup') return;
    const fetchBackups = async () => {
      try {
        const res = await fetch('/api/backups');
        const data = await res.json();
        setBackups(data);
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

  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/roles')
        ]);
        
        if (!usersRes.ok) throw new Error('Users fetch failed');
        if (!rolesRes.ok) throw new Error('Roles fetch failed');
        
        const usersText = await usersRes.text();
        const rolesText = await rolesRes.text();
        
        const usersData = usersText ? JSON.parse(usersText) : [];
        const rolesData = rolesText ? JSON.parse(rolesText) : [];
        setUsers(usersData);
        setRoles(rolesData);
      } catch (error) {
        console.error('Failed to fetch settings data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettingsData();
  }, []);

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
      case 'User Rules':
        return (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
                <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#006397] font-bold">Access Control</span>
              </nav>
              <h1 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">Access Control</h1>
              <p className="text-[15px] text-neutral-500 mt-2 font-medium">Manage organization roles, permissions, and staff credentials.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleExportAuditLogs}
                className="px-6 py-3 bg-white border border-[#edeeef] text-[#162839] font-bold text-[13px] rounded-xl hover:bg-neutral-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap uppercase tracking-widest"
              >
                <Download className="w-4 h-4" />
                Export Audit Log
              </button>
              <button 
                onClick={() => navigate('/settings/users/add')}
                className="px-6 py-3 bg-[#162839] text-white font-bold text-[13px] rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg uppercase tracking-widest whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Add New User
              </button>
            </div>
          </div>
        );
      case 'Security Logs':
        return (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-neutral-400 text-[13px] font-medium mb-2">
                <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#006397] font-bold">Audit Logs</span>
              </nav>
              <h1 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">System Audit Logs</h1>
              <p className="text-[15px] text-neutral-500 mt-2 font-medium">Real-time monitoring of all administrative actions and system modifications.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleExportAuditLogs}
                className="px-6 py-3 bg-white border border-[#edeeef] text-[#162839] font-bold text-[13px] rounded-xl hover:bg-neutral-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap uppercase tracking-widest"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button className="px-6 py-3 bg-[#006397] text-white font-bold text-[13px] rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg whitespace-nowrap uppercase tracking-widest">
                <RefreshIcon className="w-4 h-4" />
                Refresh Logs
              </button>
            </div>
          </div>
        );
      case 'Backup':
        return (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
                <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#006397] font-bold">Backup & Restore</span>
              </nav>
              <h1 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">Backup & Restore</h1>
              <p className="text-[15px] text-neutral-500 mt-2 font-medium">Manage your data integrity and system recovery protocols.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleSyncNow}
                className="px-6 py-3 bg-white border border-[#edeeef] text-[#162839] font-bold text-[13px] rounded-xl hover:bg-neutral-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <RotateCw className="w-4 h-4" />
                Sync Now
              </button>
              <button 
                onClick={handleCreateBackup} 
                disabled={isCreatingBackup}
                className="px-6 py-3 bg-[#006397] text-white font-bold text-[13px] rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg whitespace-nowrap disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                {isCreatingBackup ? 'Creating...' : 'Create Manual Backup'}
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
      case 'General':
        return (
          <div className="grid grid-cols-12 gap-8">
            <section className="col-span-12 lg:col-span-7 bg-white p-8 rounded-xl border border-[#edeeef] shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-1.5 bg-[#f3f4f5] rounded">
                  <Building2 className="w-5 h-5 text-[#006397]" />
                </div>
                <h3 className="text-[20px] font-bold text-[#162839]">Company Profile</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Factory/Company Name</label>
                  <input 
                    type="text" 
                    defaultValue="SanitaryFlow Solutions Ltd."
                    className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded px-4 py-2.5 text-[14px] font-medium focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Business Registration ID</label>
                  <input 
                    type="text" 
                    defaultValue="SF-889021-X"
                    className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded px-4 py-2.5 text-[14px] font-medium focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Official Logo</label>
                  <div className="flex items-center gap-6 p-6 border-2 border-dashed border-[#edeeef] rounded-xl bg-[#f8f9fa] group hover:border-[#5cb8fd] transition-colors">
                    <div className="w-16 h-16 bg-white p-2 rounded-lg border border-[#edeeef] flex items-center justify-center shadow-sm">
                       {logoUrl ? (
                         <img src={logoUrl} alt="Logo" className="max-w-full max-h-full" />
                       ) : (
                         <div className="w-10 h-10 border-2 border-[#006397] rounded flex items-center justify-center">
                           <div className="w-6 h-6 border-b-2 border-r-2 border-[#006397]" />
                         </div>
                       )}
                    </div>
                    <div>
                      <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#006397] text-[#006397] text-[13px] font-bold rounded-lg hover:bg-[#006397]/5 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Replace Logo
                      </button>
                      <p className="text-[11px] text-neutral-400 mt-2 font-medium italic">Recommended size: 512x512px. PNG or SVG.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Primary Contact Email</label>
                  <input 
                    type="email" 
                    defaultValue="admin@sanitaryflow.com"
                    className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded px-4 py-2.5 text-[14px] font-medium focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Phone Number</label>
                  <input 
                    type="text" 
                    defaultValue="+1 (555) 092-3481"
                    className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded px-4 py-2.5 text-[14px] font-medium focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="mt-10 pt-8 border-t border-[#edeeef] flex justify-end">
                <button 
                  onClick={handleSaveGeneral}
                  className="flex items-center gap-2 px-8 py-3 bg-[#006397] text-white text-[14px] font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            </section>

            <section className="col-span-12 lg:col-span-5 bg-white p-8 rounded-xl border border-[#edeeef] shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-1.5 bg-[#f3f4f5] rounded">
                  <Globe className="w-5 h-5 text-[#006397]" />
                </div>
                <h3 className="text-[20px] font-bold text-[#162839]">Regional Settings</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">System Currency</label>
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#c4c6cd] rounded px-4 py-2.5 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] appearance-none cursor-pointer"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code}>{curr.code} ({curr.symbol}) - {curr.name}</option>
                    ))}
                  </select>
                </div>


                <div className="pt-6 border-t border-[#edeeef] space-y-6">
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
              {/* Role Architecture */}
              <div className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
                <h3 className="text-[18px] font-bold text-[#162839] mb-8 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#006397]" />
                  Role Architecture
                </h3>
                <div className="space-y-4">
                  {roles.map((role, i) => (
                    <div 
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                        selectedRoleId === role.id 
                          ? 'bg-white border-[#006397] border-l-4 shadow-sm' 
                          : 'bg-[#f8f9fa] border-[#edeeef] hover:bg-white hover:border-[#cce5ff]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-[15px] text-[#162839]">{role.name}</p>
                          <p className="text-[12px] text-neutral-400 font-medium mt-0.5">{role.desc}</p>
                        </div>
                        <span className="text-[10px] font-black text-[#006397] bg-[#cce5ff] px-3 py-1 rounded-full uppercase tracking-widest">{role.count} Users</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate('/settings/roles/add')}
                  className="w-full mt-8 py-4 border-2 border-dashed border-[#edeeef] text-neutral-400 font-bold hover:border-[#006397] hover:text-[#006397] transition-all rounded-2xl uppercase tracking-widest text-[11px] hidden"
                >
                  + Define New Role Class
                </button>
              </div>

              {/* Permissions Card */}
              <div className="bg-[#162839] text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -top-8 opacity-5">
                  <Lock className="w-48 h-48" />
                </div>
                <h3 className="text-[20px] font-bold mb-2 relative z-10">{roles.find(r => r.id === selectedRoleId)?.name || 'Role'} Permissions</h3>
                <p className="text-[13px] text-[#96a9be] font-medium mb-8 relative z-10">Configure module visibility and action rights for this role.</p>
                <div className="space-y-4 relative z-10">
                  {ALL_MODULES.map((module, i) => {
                    const isChecked = editedPermissions.includes(module.value);
                    return (
                      <label key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-all cursor-pointer group">
                        <input 
                          type="checkbox"
                          className="hidden" 
                          checked={isChecked}
                          onChange={() => handleTogglePermission(module.value)}
                        />
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-[#5cb8fd] border-[#5cb8fd]' : 'border-white/20'}`}>
                          {isChecked && <Check className="w-3.5 h-3.5 text-[#00476e]" strokeWidth={4} />}
                        </div>
                        <span className={`text-[14px] font-medium transition-all ${isChecked ? 'text-white' : 'text-[#96a9be]'}`}>{module.label}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-10 flex gap-4 relative z-10">
                  <button 
                    onClick={handleUpdateRole} 
                    disabled={isUpdatingPermissions}
                    className="flex-1 py-3 bg-[#006397] text-white font-bold rounded-xl text-[13px] uppercase tracking-widest hover:opacity-90 shadow-lg disabled:opacity-50"
                  >
                    {isUpdatingPermissions ? 'Updating...' : 'Update Role'}
                  </button>
                  <button 
                    onClick={handleResetRole} 
                    className="flex-1 py-3 border border-white/20 text-white font-bold rounded-xl text-[13px] uppercase tracking-widest hover:bg-white/5"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: User Registry & Logs */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              {/* Registered Users Table */}
              <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-8 border-b border-[#edeeef] flex justify-between items-center bg-[#f8f9fa]">
                  <h3 className="text-[20px] font-bold text-[#162839]">Registered System Users</h3>
                  <span className="bg-white border border-[#edeeef] text-neutral-400 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest">Total: 13 Active</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50/50 border-b border-[#edeeef] text-[11px] font-black text-neutral-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-5">User</th>
                        <th className="px-8 py-5">Designated Role</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Last Login</th>
                        <th className="px-8 py-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edeeef]">
                      {users.map((u, i) => (
                        <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black text-[#162839] ${u.color || 'bg-blue-100'}`}>
                                {u.initials || u.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-[14px] font-bold text-[#162839] leading-tight">{u.name}</p>
                                <p className="text-[12px] text-neutral-400 font-medium mt-0.5">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="bg-[#d1e4fb] text-[#006397] px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest">
                              {u.role_name}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-neutral-300'}`} />
                              <span className="text-[13px] font-bold text-[#162839]">{u.status}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-[13px] font-bold text-neutral-400">
                            {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex gap-2">
                              <button className="p-2 hover:bg-[#cce5ff] text-neutral-400 hover:text-[#006397] transition-all rounded-lg">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-all rounded-lg">
                                <UserX className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-[#f8f9fa] border-t border-[#edeeef] flex justify-between items-center">
                  <span className="text-[12px] text-neutral-400 font-bold">Showing 1 to 5 of 13 users</span>
                  <div className="flex gap-2">
                    <button className="w-10 h-10 border border-[#edeeef] rounded-xl flex items-center justify-center hover:bg-white transition-all opacity-50 cursor-not-allowed">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 border border-[#edeeef] rounded-xl flex items-center justify-center hover:bg-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#d1e4fb] text-[#006397] rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-1">System Health Monitor</p>
                    <div className="flex items-end gap-2">
                      <h4 className="text-[28px] font-black text-[#162839] leading-none">Locked</h4>
                      <p className="text-[14px] font-bold text-neutral-400 leading-none pb-1">0 Fail Attempts</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#f3f4f5] text-[#162839] rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <Activity className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-2">Recent Modifications</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[13px] font-bold text-[#162839]">Role 'Sales Staff' updated</p>
                        <span className="text-[11px] text-neutral-400 font-bold">2m ago</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[13px] font-bold text-[#162839]">New user 'Elena Lucas' added</p>
                        <span className="text-[11px] text-neutral-400 font-bold">1h ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating FAB for context */}
            <button 
              onClick={() => navigate('/settings/users/add')}
              className="fixed bottom-12 right-12 w-16 h-16 bg-[#006397] text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
            >
              <Plus className="w-8 h-8" strokeWidth={3} />
            </button>
          </div>
        );
      case 'Security Logs':
        return (
          <div className="space-y-8">
            {/* Bento Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Entries', value: '128,492', sub: '+12% vs last week', icon: FileText, color: '#006397', trend: 'up' },
                { label: 'Security Alerts', value: '24', sub: 'Active today', icon: ShieldAlert, color: '#ba1a1a', trend: 'alert' },
                { label: 'Failed Logins', value: '156', sub: 'Last 24 hours', icon: UserX, color: '#162839' },
                { label: 'Storage Health', value: '98.2%', progress: 98.2, icon: Database, color: '#006397', dark: true },
              ].map((stat, i) => (
                <div key={i} className={`p-8 rounded-2xl border border-[#edeeef] shadow-sm flex flex-col gap-1 relative overflow-hidden ${stat.dark ? 'bg-[#162839] text-white border-[#2c3e50]' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${stat.dark ? 'text-[#96a9be]' : 'text-neutral-400'}`}>{stat.label}</span>
                    <stat.icon className={`w-5 h-5 ${stat.dark ? 'text-[#5cb8fd]' : ''}`} style={{ color: !stat.dark ? stat.color : undefined }} />
                  </div>
                  <p className="text-[28px] font-black tracking-tight">{stat.value}</p>
                  {stat.sub && (
                    <div className={`flex items-center gap-1 text-[13px] font-bold mt-1 ${stat.trend === 'up' ? 'text-emerald-600' : stat.trend === 'alert' ? 'text-red-600' : 'text-neutral-400'}`}>
                      {stat.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                      {stat.sub}
                    </div>
                  )}
                  {stat.progress && (
                    <div className="mt-4">
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#5cb8fd] h-full transition-all duration-1000" style={{ width: `${stat.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Filters Section */}
            <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden mt-8">
              <div className="p-8 border-b border-[#edeeef] flex flex-wrap gap-8 items-center">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <label className="text-[13px] font-black text-[#162839] uppercase tracking-widest">Search</label>
                  <div className="flex items-center flex-1 min-w-[150px] gap-3 border border-[#c4c6cd] px-4 py-2.5 rounded-xl bg-[#f8f9fa]">
                    <Search className="w-4 h-4 text-neutral-400" />
                    <input 
                      type="text" 
                      placeholder="Search users, actions..." 
                      className="bg-transparent border-none outline-none text-[14px] font-bold text-[#162839] w-full"
                      value={logSearchQuery}
                      onChange={(e) => {
                        setLogSearchQuery(e.target.value);
                        setLogCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-black text-[#162839] uppercase tracking-widest">Module</label>
                  <div className="relative">
                    <select 
                      className="bg-[#f8f9fa] border border-[#c4c6cd] px-4 py-2.5 rounded-xl text-[14px] font-bold text-[#162839] outline-none appearance-none min-w-[180px] pr-10 cursor-pointer"
                      value={logModuleFilter}
                      onChange={(e) => {
                        setLogModuleFilter(e.target.value);
                        setLogCurrentPage(1);
                      }}
                    >
                      {availableLogModules.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-4 top-3.5 pointer-events-none" />
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
                    className="text-red-500 text-[13px] font-black flex items-center gap-2 hover:underline mr-4"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Table Area */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#f3f4f5] border-b border-[#edeeef] text-[11px] font-black text-neutral-500 uppercase tracking-widest">
                      <th className="px-8 py-5">Timestamp</th>
                      <th className="px-8 py-5">User</th>
                      <th className="px-8 py-5">Action</th>
                      <th className="px-8 py-5">Module</th>
                      <th className="px-8 py-5">Severity</th>
                      <th className="px-8 py-5">Description</th>
                      <th className="px-8 py-5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edeeef]">
                    {logsLoading ? (
                      <tr><td colSpan={7} className="px-8 py-12 text-center text-neutral-400 font-bold">Loading logs...</td></tr>
                    ) : auditLogs.length === 0 ? (
                      <tr><td colSpan={7} className="px-8 py-12 text-center text-neutral-400 font-bold">No logs found.</td></tr>
                    ) : auditLogs.map((log, i) => {
                      const d = new Date(log.timestamp);
                      const severity = log.action === 'DELETE' ? 'Critical' : log.action.includes('error') ? 'Warning' : 'Info';
                      
                      return (
                      <tr key={i} className="hover:bg-neutral-50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="text-[14px] font-black text-[#162839]">{d.toISOString().split('T')[0]}</div>
                          <div className="text-[11px] text-neutral-400 font-bold uppercase mt-0.5">{d.toTimeString().split(' ')[0]}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#cce5ff] flex items-center justify-center text-[#006397] font-black text-[12px] border border-[#edeeef]">
                               {log.user ? log.user.substring(0, 2).toUpperCase() : 'SY'}
                            </div>
                            <div>
                              <div className="text-[14px] font-black text-[#162839]">{log.user || 'System Automation'}</div>
                              <div className="text-[11px] text-neutral-400 font-bold">{(log.user || 'system').toLowerCase().replace(' ', '.')}@sanitaryflow.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                            log.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-100' :
                            log.action === 'UPDATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            log.action === 'LOGIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            'bg-orange-50 text-orange-700 border-orange-100'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-[14px] font-medium text-neutral-600">
                             {log.module === 'Inventory' && <PlusCircle className="w-4 h-4" />}
                             {log.module === 'Production' && <Factory className="w-4 h-4" />}
                             {log.module === 'Security' && <ShieldIcon className="w-4 h-4" />}
                             {log.module === 'Sales' && <CreditCard className="w-4 h-4" />}
                             {log.module}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-tight border ${
                            severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-100' :
                            severity === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              severity === 'Critical' ? 'bg-red-600' :
                              severity === 'Warning' ? 'bg-amber-600' :
                              'bg-blue-600'
                            }`} />
                            {severity}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-[14px] text-neutral-500 font-medium max-w-[320px] truncate" title={log.details}>
                          {log.details || log.action}
                        </td>
                        <td className="px-8 py-6">
                          <button className="text-neutral-400 hover:text-[#162839] transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-8 border-t border-[#edeeef] flex justify-between items-center bg-[#f8f9fa]">
                <span className="text-[13px] text-neutral-400 font-bold">Showing {totalLogs === 0 ? 0 : ((logCurrentPage - 1) * logsPerPage) + 1} to {Math.min(logCurrentPage * logsPerPage, totalLogs)} of {totalLogs.toLocaleString()} entries</span>
                <div className="flex gap-2">
                  <button 
                    disabled={logCurrentPage === 1}
                    onClick={() => setLogCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="w-10 h-10 flex items-center justify-center border border-[#edeeef] rounded-xl bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f3f4f5] transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
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
                        className={`w-10 h-10 flex items-center justify-center border rounded-xl text-[13px] font-bold transition-all ${
                          pageNum === logCurrentPage 
                            ? 'border-[#006397] bg-[#cce5ff] text-[#006397]' 
                            : 'border-[#edeeef] bg-white hover:bg-[#f3f4f5] text-[#162839]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {totalLogPages > 5 && logCurrentPage < totalLogPages - 2 && (
                    <>
                      <span className="w-10 h-10 flex items-center justify-center text-neutral-300 font-black">...</span>
                      <button
                        onClick={() => setLogCurrentPage(totalLogPages)}
                        className="px-4 h-10 flex items-center justify-center border border-[#edeeef] bg-white hover:bg-[#f3f4f5] rounded-xl text-[13px] font-bold transition-all text-[#162839]"
                      >
                        {totalLogPages}
                      </button>
                    </>
                  )}

                  <button 
                    disabled={logCurrentPage === totalLogPages}
                    onClick={() => setLogCurrentPage(prev => Math.min(prev + 1, totalLogPages))}
                    className="w-10 h-10 flex items-center justify-center border border-[#edeeef] rounded-xl bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f3f4f5] transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
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
              {/* Status Card */}
              <div className="col-span-12 lg:col-span-4 bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm flex flex-col justify-between overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-black rounded uppercase tracking-widest border border-emerald-100">System Healthy</span>
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-[20px] font-black text-[#162839] leading-tight">Last Backup {lastSuccessfulBackup ? 'Successful' : 'Unavailable'}</h3>
                  <p className="text-[14px] text-neutral-400 font-medium mt-2">{lastSuccessfulBackup ? `${new Date(lastSuccessfulBackup.date).toLocaleString()} (Scheduled)` : 'No successful backups found'}</p>
                  
                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-[#f3f4f5]">
                      <span className="text-[13px] text-neutral-500 font-medium">Total Data Size</span>
                      <span className="text-[13px] font-black text-[#162839]">{lastSuccessfulBackup ? lastSuccessfulBackup.size : '--'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-[13px] text-neutral-500 font-medium">Encryption</span>
                      <span className="text-[13px] font-black text-[#006397]">AES-256 Active</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 opacity-5">
                  <ShieldCheck className="w-40 h-40" />
                </div>
              </div>

              {/* Automated Schedules Config */}
              <div className="col-span-12 lg:col-span-8 bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-[#cce5ff] flex items-center justify-center rounded-xl text-[#006397]">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-black text-[#162839]">Automated Schedules</h3>
                    <p className="text-[14px] text-neutral-400 font-medium">Configure recurring system snapshots.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Daily */}
                  <div className={`p-6 border border-[#edeeef] rounded-2xl ${backupSchedules.daily.enabled ? 'bg-[#f8f9fa]' : 'opacity-80'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[11px] font-black text-[#162839] uppercase tracking-widest">Daily Backup</span>
                      <div 
                        className={`w-10 h-5 rounded-full relative p-1 shadow-inner cursor-pointer ${backupSchedules.daily.enabled ? 'bg-[#006397]' : 'bg-neutral-200'}`} 
                        onClick={() => setBackupSchedules(prev => ({...prev, daily: {...prev.daily, enabled: !prev.daily.enabled}}))}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${backupSchedules.daily.enabled ? 'right-1' : 'left-1'}`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className={`text-[13px] font-medium ${backupSchedules.daily.enabled ? 'text-neutral-500' : 'text-neutral-400'}`}>Every day at:</p>
                      <div className="relative">
                        <select 
                          disabled={!backupSchedules.daily.enabled}
                          className={`w-full h-10 border border-[#edeeef] rounded-lg px-4 text-[13px] font-black outline-none appearance-none pr-10 ${backupSchedules.daily.enabled ? 'bg-white text-[#162839] cursor-pointer' : 'bg-neutral-50 text-neutral-300 cursor-not-allowed'}`}
                          value={backupSchedules.daily.time}
                          onChange={e => setBackupSchedules(prev => ({...prev, daily: {...prev.daily, time: e.target.value}}))}
                        >
                          <option value="04:00 AM">04:00 AM</option>
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="08:00 PM">08:00 PM</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Weekly */}
                  <div className={`p-6 border border-[#edeeef] rounded-2xl ${backupSchedules.weekly.enabled ? 'bg-[#f8f9fa]' : 'opacity-80'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[11px] font-black text-[#162839] uppercase tracking-widest">Weekly Snapshot</span>
                      <div 
                        className={`w-10 h-5 rounded-full relative p-1 shadow-inner cursor-pointer ${backupSchedules.weekly.enabled ? 'bg-[#006397]' : 'bg-neutral-200'}`} 
                        onClick={() => setBackupSchedules(prev => ({...prev, weekly: {...prev.weekly, enabled: !prev.weekly.enabled}}))}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${backupSchedules.weekly.enabled ? 'right-1' : 'left-1'}`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className={`text-[13px] font-medium ${backupSchedules.weekly.enabled ? 'text-neutral-500' : 'text-neutral-400'}`}>Every Sunday at:</p>
                      <div className="relative">
                        <select 
                          disabled={!backupSchedules.weekly.enabled}
                          className={`w-full h-10 border border-[#edeeef] rounded-lg px-4 text-[13px] font-black outline-none appearance-none pr-10 ${backupSchedules.weekly.enabled ? 'bg-white text-[#162839] cursor-pointer' : 'bg-neutral-50 text-neutral-300 cursor-not-allowed'}`}
                          value={backupSchedules.weekly.time}
                          onChange={e => setBackupSchedules(prev => ({...prev, weekly: {...prev.weekly, time: e.target.value}}))}
                        >
                          <option value="02:00 AM">02:00 AM</option>
                          <option value="03:00 AM">03:00 AM</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Monthly Archive */}
                  <div className={`p-6 border border-[#edeeef] rounded-2xl ${backupSchedules.monthly.enabled ? 'bg-[#f8f9fa]' : 'opacity-80'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[11px] font-black text-[#162839] uppercase tracking-widest">Monthly Archive</span>
                      <div 
                        className={`w-10 h-5 rounded-full relative p-1 shadow-inner cursor-pointer ${backupSchedules.monthly.enabled ? 'bg-[#006397]' : 'bg-neutral-200'}`} 
                        onClick={() => setBackupSchedules(prev => ({...prev, monthly: {...prev.monthly, enabled: !prev.monthly.enabled}}))}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${backupSchedules.monthly.enabled ? 'right-1' : 'left-1'}`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className={`text-[13px] font-medium ${backupSchedules.monthly.enabled ? 'text-neutral-500' : 'text-neutral-400'}`}>Last day of month:</p>
                      <div className="relative">
                        <select 
                          disabled={!backupSchedules.monthly.enabled}
                          className={`w-full h-10 border border-[#edeeef] rounded-lg px-4 text-[13px] font-black outline-none appearance-none pr-10 ${backupSchedules.monthly.enabled ? 'bg-white text-[#162839] cursor-pointer' : 'bg-neutral-50 text-neutral-300 cursor-not-allowed'}`}
                          value={backupSchedules.monthly.time}
                          onChange={e => setBackupSchedules(prev => ({...prev, monthly: {...prev.monthly, time: e.target.value}}))}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="11:59 PM">11:59 PM</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backup History Table */}
              <div className="col-span-12 bg-white border border-[#edeeef] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-8 border-b border-[#f3f4f5] flex items-center justify-between">
                  <h3 className="text-[20px] font-black text-[#162839]">Backup History</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] text-neutral-400 font-medium">Show:</span>
                    <div className="relative">
                      <select className="bg-white border border-[#edeeef] rounded-lg px-4 py-2 text-[13px] font-black outline-none cursor-pointer pr-10">
                        <option>Last 30 days</option>
                        <option>Last 6 months</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#f8f9fa] text-[11px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                        <th className="px-8 py-5">Date/Time</th>
                        <th className="px-8 py-5">File Name</th>
                        <th className="px-8 py-5">Size</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px] divide-y divide-[#f3f4f5]">
                      {backupsLoading ? (
                        <tr><td colSpan={5} className="px-8 py-12 text-center text-neutral-400 font-bold">Loading backups...</td></tr>
                      ) : backups.length === 0 ? (
                        <tr><td colSpan={5} className="px-8 py-12 text-center text-neutral-400 font-bold">No backups found.</td></tr>
                      ) : backups.map((backup, i) => (
                        <tr key={i} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-8 py-6 text-neutral-500 font-medium">{new Date(backup.date).toLocaleString()}</td>
                          <td className="px-8 py-6 font-black text-[#162839]">{backup.name}</td>
                          <td className="px-8 py-6 text-neutral-400 font-medium">{backup.size}</td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              backup.status === 'Successful' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${backup.status === 'Successful' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {backup.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right whitespace-nowrap">
                              {backup.status !== 'Failed' ? (
                                <>
                                  <button onClick={() => handleBackupAction(backup.id, 'download')} className="text-[#006397] font-black text-[13px] hover:underline focus:outline-none">Download</button>
                                  <span className="text-neutral-200 mx-3">|</span>
                                  <button onClick={() => handleBackupAction(backup.id, 'restore')} className="text-[#006397] font-black text-[13px] hover:underline focus:outline-none">Restore</button>
                                </>
                              ) : (
                                <button onClick={() => handleBackupAction(backup.id, 'retry')} className="text-[#006397] font-black text-[13px] hover:underline focus:outline-none">Retry Backup</button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Restore Section */}
              <div className="col-span-12 lg:col-span-8 bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
                <h3 className="text-[20px] font-black text-[#162839] mb-6">Restore from Local File</h3>
                <div onClick={() => backupFileInputRef.current?.click()} className="border-4 border-dashed border-[#edeeef] rounded-3xl p-16 flex flex-col items-center justify-center text-center bg-[#f8f9fa] group hover:bg-[#f3f4f5] transition-all cursor-pointer relative">
                  <input type="file" ref={backupFileInputRef} className="hidden" onChange={handleBackupUpload} accept=".gz,.sql,.zip" />
                  <div className="p-6 bg-white rounded-full shadow-lg text-neutral-400 group-hover:scale-110 transition-transform mb-6">
                    <Upload className="w-10 h-10" />
                  </div>
                  <p className="text-[18px] font-black text-[#162839]">Drag and drop backup file (.gz, .sql, .zip)</p>
                  <p className="text-[14px] text-neutral-400 font-medium mt-2">or click to browse from your computer</p>
                </div>

                {/* Overwrite Warning */}
                <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex gap-6 items-start">
                  <div className="p-3 bg-white rounded-xl text-red-500 shadow-sm border border-red-100">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[16px] font-black text-red-900 leading-none mt-1">Data Overwrite Warning</p>
                    <p className="text-[14px] text-red-700/80 font-medium leading-relaxed">
                      Restoring a backup will completely overwrite your current live production database. This action cannot be undone. It is strongly recommended to create a manual backup of your current state before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar Cards */}
              <div className="col-span-12 lg:col-span-4 space-y-8">
                {/* Retention Policy */}
                <div className="bg-[#162839] text-white rounded-2xl p-8 shadow-xl border border-[#2c3e50] relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-2 bg-white/10 text-[#5cb8fd] rounded-lg">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-[18px] font-black tracking-tight">Retention Policy</h3>
                  </div>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <div className="p-1 text-[#5cb8fd] mt-0.5">
                        <History className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] leading-relaxed font-medium text-[#96a9be]">
                          Standard backups are retained for before automatic deletion.
                        </p>
                        <div className="mt-3 relative w-32">
                          <select 
                            value={retentionDays}
                            onChange={(e) => setRetentionDays(Number(e.target.value))}
                            className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-4 text-[13px] font-black text-white outline-none appearance-none cursor-pointer pr-10 focus:border-[#5cb8fd] hover:bg-white/10 transition-all"
                          >
                            <option value={30} className="text-[#162839]">30 days</option>
                            <option value={60} className="text-[#162839]">60 days</option>
                            <option value={90} className="text-[#162839]">90 days</option>
                            <option value={180} className="text-[#162839]">180 days</option>
                            <option value={365} className="text-[#162839]">1 Year</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-white/50 absolute right-3 top-3 pointer-events-none" />
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="p-1 text-[#5cb8fd] mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <p className="text-[14px] leading-relaxed font-medium text-[#96a9be]">
                        All backup files are encrypted using <strong className="text-white">AES-256</strong> at rest and in transit.
                      </p>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="p-1 text-[#5cb8fd] mt-0.5">
                        <Globe className="w-4 h-4" />
                      </div>
                      <p className="text-[14px] leading-relaxed font-medium text-[#96a9be]">
                        Redundant copies are kept across <strong className="text-white">3 geographical zones</strong> for disaster recovery.
                      </p>
                    </li>
                  </ul>
                  <div className="absolute -bottom-6 -right-6 text-white/5 opacity-50">
                    <Lock className="w-32 h-32" />
                  </div>
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
      <div className="flex border-b border-[#edeeef] gap-10">
        {['General', 'User Rules', 'Security Logs', 'Backup'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[14px] font-bold transition-all relative ${
              activeTab === tab ? 'text-[#006397]' : 'text-neutral-400 hover:text-neutral-50'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#006397]" 
              />
            )}
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
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
