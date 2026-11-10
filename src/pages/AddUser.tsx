import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Bell, 
  HelpCircle, 
  UserPlus, 
  ShieldCheck,
  BadgeCheck,
  Info,
  ChevronRight,
  Eye,
  EyeOff,
  History,
  ToggleLeft as Toggle,
  CheckCircle2,
  Lock,
  Smartphone
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppContext } from '../store';
import { GlassSelect } from '../components/GlassUI';

interface Role {
  id: string;
  name: string;
  permissions: string;
}

export default function AddUser() {
  const navigate = useNavigate();
  const { showToast } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [onboardingMethod, setOnboardingMethod] = useState(true);
  const [activeAccount, setActiveAccount] = useState(true);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    role_id: '',
  });

  useEffect(() => {
    fetch('/api/roles')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch roles');
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => setRoles(data))
      .catch(err => console.error(err));
  }, []);

  const handleCreateUser = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.role_id) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (!onboardingMethod) {
      if (!password) {
        showToast('Please provide an initial password', 'error');
        return;
      }
      if (password.length < 4) {
        showToast('Password must be at least 4 characters long', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          password: !onboardingMethod && password ? password : 'password123',
          status: activeAccount ? 'Active' : 'Deactivated',
          initials: formData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          color: 'bg-blue-100'
        }),
      });

      if (response.ok) {
        showToast('User created successfully!', 'success');
        navigate('/settings');
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to create user', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('An unexpected error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeLogo = '/assets/aistudio/image_6670885d.png?v=2';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-[20px] bg-white/95 border border-white shadow-[0_8px_22px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center p-1.5 shrink-0 overflow-hidden mt-1">
            <img src={activeLogo} alt="SanitaryFlow Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
              <Link to="/settings" className="hover:text-[#006397] transition-colors">Settings</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to="/settings" className="hover:text-[#006397] transition-colors">User Management</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-neutral-500 font-bold">New User</span>
            </nav>
            <h1 className="text-[32px] font-bold text-[#162839] tracking-tight leading-none">Create New System User</h1>
            <p className="text-[15px] text-neutral-500 mt-2 font-medium">Configure account access, roles, and security protocols for a new employee.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/settings')}
            disabled={saving}
            className="glass-pill-button px-7 py-3 text-slate-700 font-semibold rounded-full hover:bg-white/95 transition-all text-[14px] disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreateUser}
            disabled={saving}
            className="px-7 py-3 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 hover:from-[#0369a1] hover:to-sky-600 text-white font-semibold flex items-center gap-2 transition-all shadow-[0_6px_20px_rgba(2,132,199,0.28)] hover:-translate-y-0.5 active:translate-y-0 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving && (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Form Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Section: Account Details */}
          <section className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Account Details</h3>
                <p className="text-[13px] text-slate-500 font-medium">Personal identity and login credentials</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Johnathan Smith"
                  className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Employee ID</label>
                <input 
                  type="text" 
                  placeholder="SF-2024-000"
                  className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Work Email Address <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jsmith@sanitaryflow.com"
                  className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Username <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="j.smith"
                  className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section: Security Settings */}
          <section className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Security Settings</h3>
                <p className="text-[13px] text-slate-500 font-medium">Password policy and invitation workflow</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-white/80 border border-white rounded-2xl shadow-2xs">
                <div>
                  <p className="font-bold text-slate-900 text-[14.5px]">Onboarding Method</p>
                  <p className="text-[12.5px] text-slate-500 font-medium mt-0.5">Send a secure invite email for the user to set their own password.</p>
                </div>
                <button 
                  type="button"
                  role="switch"
                  aria-checked={onboardingMethod}
                  onClick={() => setOnboardingMethod(!onboardingMethod)}
                  className={`w-[52px] h-[30px] rounded-full p-[3px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer border relative shrink-0 ${
                    onboardingMethod 
                      ? 'bg-gradient-to-r from-[#0284c7] via-sky-400 to-cyan-400 border-white/80 shadow-[0_4px_12px_rgba(2,132,199,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.45)]' 
                      : 'bg-slate-200/80 border-white/90 shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)]'
                  }`}
                >
                  <div className={`w-[22px] h-[22px] bg-white rounded-full shadow-[0_2px_6px_rgba(15,23,42,0.2),inset_0_1px_1px_rgba(255,255,255,1)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${onboardingMethod ? 'translate-x-[22px]' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${onboardingMethod ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Initial Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl px-4 py-3 pr-12 text-[14px] font-medium text-slate-900 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Form Column */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Section: Role Assignment */}
          <section className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Role Assignment</h3>
                <p className="text-[13px] text-slate-500 font-medium">Permissions configuration</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Select System Role</label>
                <div className="relative">
                  <GlassSelect 
                    value={formData.role_id}
                    onChange={(e) => {
                      const roleId = e.target.value;
                      setFormData({ ...formData, role_id: roleId });
                      const selectedRole = roles.find(r => r.id === roleId);
                      if (selectedRole && selectedRole.permissions) {
                        try {
                          setSelectedRolePermissions(JSON.parse(selectedRole.permissions));
                        } catch(e) {
                          setSelectedRolePermissions([]);
                        }
                      } else {
                        setSelectedRolePermissions([]);
                      }
                    }}
                  >
                    <option value="">Choose a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </GlassSelect>
                </div>
                <p className="text-[12px] text-slate-500 font-medium italic mt-1.5">Roles define feature access and data visibility permissions.</p>
              </div>

              <div className="bg-sky-50/70 p-5 rounded-2xl border border-sky-100 space-y-3">
                <div className="flex items-center gap-2 text-[#0284c7]">
                  <Info className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Permissions Summary</span>
                </div>
                <ul className="space-y-2">
                  {selectedRolePermissions.length > 0 ? selectedRolePermissions.map((perm, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13px] font-medium text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0284c7]" />
                      {perm}
                    </li>
                  )) : (
                    <li className="text-[12.5px] text-slate-400 italic">No permissions assigned</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Section: Status Toggle */}
          <section className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-emerald-600 flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">User Status</h3>
                <p className="text-[13px] text-slate-500 font-medium">Access lifecycle control</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-[15px]">Active Account</p>
                <p className="text-[12.5px] text-slate-500 font-medium mt-0.5">Immediate system access</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={activeAccount}
                onClick={() => setActiveAccount(!activeAccount)}
                className={`w-[52px] h-[30px] rounded-full p-[3px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer border relative shrink-0 ${
                  activeAccount 
                    ? 'bg-gradient-to-r from-[#0284c7] via-sky-400 to-cyan-400 border-white/80 shadow-[0_4px_12px_rgba(2,132,199,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.45)]' 
                    : 'bg-slate-200/80 border-white/90 shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)]'
                }`}
              >
                <div className={`w-[22px] h-[22px] bg-white rounded-full shadow-[0_2px_6px_rgba(15,23,42,0.2),inset_0_1px_1px_rgba(255,255,255,1)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${activeAccount ? 'translate-x-[22px]' : 'translate-x-0'}`} />
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Footer Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-[#edeeef]">
        <div className="flex items-center gap-3 text-neutral-400 text-[13px] font-medium">
          <History className="w-4 h-4" />
          Last system change: 2 hours ago by admin
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => navigate('/settings')}
            disabled={saving}
            className="flex-1 md:flex-none glass-pill-button px-7 py-3.5 text-slate-700 font-semibold text-[14px] rounded-full hover:bg-white/95 transition-all disabled:opacity-50 cursor-pointer"
          >
            Discard Draft
          </button>
          <button 
            onClick={handleCreateUser}
            disabled={saving}
            className="flex-1 md:flex-none px-9 py-3.5 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 hover:from-[#0369a1] hover:to-sky-600 text-white font-semibold text-[14px] transition-all shadow-[0_6px_20px_rgba(2,132,199,0.28)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving && (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {saving ? 'Finalizing...' : 'Finalize & Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}
