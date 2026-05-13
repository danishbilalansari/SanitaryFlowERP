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
  
  const [roles, setRoles] = useState<Role[]>([]);
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

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
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
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/settings')}
            className="px-8 py-3 bg-white border border-[#c4c6cd] text-[#162839] font-bold rounded-xl hover:bg-neutral-50 transition-all text-[13px] uppercase tracking-widest shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreateUser}
            className="bg-[#006397] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg uppercase tracking-widest text-[13px]"
          >
            Create User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Form Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Section: Account Details */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-[#edeeef] pb-4">
              <UserPlus className="w-5 h-5 text-[#006397]" />
              <h3 className="text-[18px] font-bold text-[#162839]">Account Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest block">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Johnathan Smith"
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest block">Employee ID</label>
                <input 
                  type="text" 
                  placeholder="SF-2024-000"
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest block">Work Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jsmith@sanitaryflow.com"
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest block">Username</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="j.smith"
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section: Security Settings */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-[#edeeef] pb-4">
              <Lock className="w-5 h-5 text-[#006397]" />
              <h3 className="text-[18px] font-bold text-[#162839]">Security Settings</h3>
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between p-6 bg-[#f8f9fa] border border-[#edeeef] rounded-2xl">
                <div>
                  <p className="font-bold text-[#162839] text-[15px]">Onboarding Method</p>
                  <p className="text-[13px] text-neutral-400 font-medium mt-1">Send a secure invite email for the user to set their own password.</p>
                </div>
                <button 
                  onClick={() => setOnboardingMethod(!onboardingMethod)}
                  className={`w-14 h-7 rounded-full transition-all relative ${onboardingMethod ? 'bg-[#006397]' : 'bg-neutral-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${onboardingMethod ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity ${onboardingMethod ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest block">Initial Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 pr-12 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#006397] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest block">Confirm Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Form Column */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Section: Role Assignment */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-[#edeeef] pb-4">
              <ShieldCheck className="w-5 h-5 text-[#006397]" />
              <h3 className="text-[18px] font-bold text-[#162839]">Role Assignment</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest block">Select System Role</label>
                <div className="relative">
                  <select 
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
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-4 text-[14px] font-bold text-[#162839] outline-none appearance-none focus:ring-2 focus:ring-[#5cb8fd] transition-all cursor-pointer"
                  >
                    <option value="">Choose a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <ChevronRight className="w-4 h-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                </div>
                <p className="text-[12px] text-neutral-400 font-medium italic mt-2">Roles define feature access and data visibility permissions.</p>
              </div>

              <div className="bg-[#d1e4fb]/30 p-6 rounded-2xl border border-[#d1e4fb] space-y-4">
                <div className="flex items-center gap-2 text-[#00476e]">
                  <Info className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Permissions Summary</span>
                </div>
                <ul className="space-y-3">
                  {selectedRolePermissions.length > 0 ? selectedRolePermissions.map((perm, i) => (
                    <li key={i} className="flex items-center gap-3 text-[13px] font-bold text-[#00476e]">
                      <CheckCircle2 className="w-4 h-4 text-[#006397]" />
                      {perm}
                    </li>
                  )) : (
                    <li className="text-[13px] text-neutral-400 italic">No permissions assigned</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Section: Status Toggle */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-[#edeeef] pb-4">
              <BadgeCheck className="w-5 h-5 text-[#006397]" />
              <h3 className="text-[18px] font-bold text-[#162839]">User Status</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[#162839] text-[15px]">Active Account</p>
                <p className="text-[13px] text-neutral-400 font-medium mt-1">Immediate system access</p>
              </div>
              <button 
                onClick={() => setActiveAccount(!activeAccount)}
                className={`w-14 h-7 rounded-full transition-all relative ${activeAccount ? 'bg-[#006397]' : 'bg-neutral-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${activeAccount ? 'right-1' : 'left-1'}`} />
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
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => navigate('/settings')}
            className="flex-1 md:flex-none px-8 py-4 bg-white border border-[#edeeef] text-neutral-500 font-black text-[14px] rounded-2xl hover:bg-neutral-50 transition-all uppercase tracking-widest"
          >
            Discard Draft
          </button>
          <button 
            onClick={handleCreateUser}
            className="flex-1 md:flex-none px-12 py-4 bg-[#006397] text-white font-black text-[14px] rounded-2xl hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            Finalize & Create User
          </button>
        </div>
      </div>
    </div>
  );
}
