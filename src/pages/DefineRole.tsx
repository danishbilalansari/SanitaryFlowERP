import React, { useState } from 'react';
import { 
  ChevronRight, 
  BadgeCheck, 
  ShieldAlert, 
  ShieldCheck, 
  Check, 
  Clock, 
  Lock, 
  Factory,
  ShoppingCart,
  LayoutDashboard,
  Settings as SettingsIcon,
  BarChart3,
  Search,
  Bell,
  HelpCircle,
  Package,
  ArrowRight,
  Monitor
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { GlassSelect, GlassToggle } from '../components/GlassUI';
import { invalidateApiCache } from '../lib/apiCache';

export default function DefineRole() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    desc: '',
  });
  const [saving, setSaving] = useState(false);

  const handleCreateRole = async () => {
    if (!formData.name) {
      alert('Role name is required');
      return;
    }

    setSaving(true);
    try {
      const id = formData.name.toLowerCase().replace(/\s+/g, '-');
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: formData.name,
          desc: formData.desc,
          active: true,
          count: 0,
          permissions: JSON.stringify(['Dashboard']) // Default
        }),
      });

      if (response.ok) {
        invalidateApiCache('/api/roles');
        navigate('/settings');
      } else {
        alert('Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
    } finally {
      setSaving(false);
    }
  };

  const modules = [
    { name: 'Inventory', icon: Package, view: true, edit: true, delete: false, export: true },
    { name: 'Production', icon: Factory, view: true, edit: true, delete: false, export: false },
    { name: 'Sales', icon: ShoppingCart, view: true, edit: false, delete: false, export: false },
    { name: 'Purchases', icon: ShoppingCart, view: true, edit: false, delete: false, export: false },
    { name: 'Labour', icon: Package, view: true, edit: true, delete: false, export: false },
    { name: 'Reports', icon: BarChart3, view: true, edit: false, delete: false, export: true },
    { name: 'Settings', icon: SettingsIcon, view: true, edit: false, delete: false, export: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/settings" className="hover:text-[#006397] transition-colors">Settings</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/settings" className="hover:text-[#006397] transition-colors">Roles & Permissions</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-neutral-500 font-bold">New Role Class</span>
          </nav>
          <h1 className="text-[32px] font-bold text-[#162839] tracking-tight leading-none">Define Role Class</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/settings')}
            disabled={saving}
            className="glass-pill-button px-7 py-3 text-slate-700 font-semibold rounded-full hover:bg-white/95 transition-all text-[14px] disabled:opacity-50 cursor-pointer"
          >
            Discard Changes
          </button>
          <button 
            onClick={handleCreateRole}
            disabled={saving}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-[#0284c7] to-sky-500 hover:from-[#0369a1] hover:to-sky-600 text-white font-semibold transition-all shadow-[0_6px_20px_rgba(2,132,199,0.28)] hover:-translate-y-0.5 active:translate-y-0 text-[14px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving && (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {saving ? 'Saving...' : 'Save Role Class'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Role Identity */}
          <section className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Role Identity</h3>
                <p className="text-[13px] text-slate-500 font-medium">Name and hierarchy classification</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Role Class Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Regional Floor Manager"
                  className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Description</label>
                <textarea 
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  placeholder="Define the primary responsibilities and scope of this role..."
                  rows={4}
                  className="w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-900 outline-none transition-all resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] block">Hierarchy Level</label>
                <div className="relative">
                  <GlassSelect defaultValue="Level 3 - Supervisor (Departmental)">
                    <option>Level 1 - Administrative (Full Access)</option>
                    <option>Level 2 - Management (Operational)</option>
                    <option>Level 3 - Supervisor (Departmental)</option>
                    <option>Level 4 - Staff (Transactional)</option>
                  </GlassSelect>
                </div>
              </div>
            </div>
          </section>

          {/* Administrative Overrides */}
          <section className="glass-card p-7 sm:p-8 rounded-[30px] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-200/60 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50/90 border border-rose-100 text-rose-600 flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(244,63,94,0.06)]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-rose-600 tracking-tight">Administrative Overrides</h3>
                <p className="text-[13px] text-slate-500 font-medium">Elevated authority flags</p>
              </div>
            </div>
            <p className="text-[12.5px] text-slate-500 font-medium leading-relaxed">
              System-wide actions that bypass standard module restrictions. Use with extreme caution.
            </p>
            
            <div className="space-y-3">
              {[
                { label: 'Can bypass approval workflows' },
                { label: 'Can access audit logs' },
                { label: 'Can manage other users' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/80 border border-white rounded-2xl hover:bg-white transition-all group shadow-2xs">
                  <span className="text-[13.5px] font-semibold text-slate-800 group-hover:text-[#0284c7] transition-colors">{item.label}</span>
                  <GlassToggle size="sm" defaultChecked={false} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Permissions Matrix */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="glass-table-container rounded-[30px] overflow-hidden flex flex-col">
            <div className="p-7 sm:p-8 border-b border-slate-200/60 bg-white/40 flex justify-between items-center">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/95 border border-white text-[#0284c7] flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Module Permissions</h3>
                  <p className="text-[13px] text-slate-500 font-medium">Access boundaries across system modules</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button className="text-[11px] font-bold uppercase tracking-widest text-[#0284c7] hover:underline transition-all cursor-pointer">Select All</button>
                <button className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all cursor-pointer">Clear All</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                    <th className="px-8 py-5">Module Name</th>
                    <th className="px-8 py-5 text-center">View</th>
                    <th className="px-8 py-5 text-center">Create/Edit</th>
                    <th className="px-8 py-5 text-center">Delete</th>
                    <th className="px-8 py-5 text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edeeef]">
                  {modules.map((mod, i) => (
                    <tr key={i} className="group hover:bg-[#f8f9fa]/50 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <mod.icon className="w-4 h-4 text-neutral-400" />
                          <span className="text-[15px] font-bold text-[#162839]">{mod.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <GlassToggle size="sm" defaultChecked={mod.view} />
                      </td>
                      <td className="px-8 py-6 text-center">
                        <GlassToggle size="sm" defaultChecked={mod.edit} />
                      </td>
                      <td className="px-8 py-6 text-center">
                        <GlassToggle size="sm" defaultChecked={mod.delete} />
                      </td>
                      <td className="px-8 py-6 text-center">
                        <GlassToggle size="sm" defaultChecked={mod.export} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-white/40 backdrop-blur-md border-t border-slate-200/60">
              <div className="flex items-start gap-8">
                <div className="w-24 h-24 bg-white/90 border border-white rounded-2xl overflow-hidden shrink-0 shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYJPuUeWQ6uugHXNnvR_T7N6-II-d7xsOr3Z4PXFogtNtneSUiEr8uF5GIbvu6oAVlu3X7W98JIGma0xA9V8JDhiRVHPCC9suzWCurXWu0RuAwcncYDBqwP24U3FvJ8h_WxJL6MWt6z7NXjf9_X8nKToGPkIuZ13qQmJj9lWRjh9Vb7MmTLzmkMPqyuPXc7drJfk4MivPp3KCEFWjdL5DLWdAWQJdC140sXzpYFP5XdvhJqmQCU5YtAf1CGA40Bzb6PWO4OkAprN7i" 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900 mb-2">Permission Impact Preview</h4>
                  <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                    The selected permissions will grant access to 14 sub-modules and 3 active dashboard widgets. 
                    Users in this Role Class will be able to perform critical inventory adjustments but will require manager approval for deletions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-[#edeeef] text-neutral-400 text-[12px] font-bold">
        <div className="flex items-center gap-8">
          <p className="uppercase tracking-widest">Created by: <span className="text-[#162839]">System Admin</span></p>
          <p className="uppercase tracking-widest">Last Audit: <span className="text-[#162839]">Today, 09:12 AM</span></p>
        </div>
        <div className="flex items-center gap-2 uppercase tracking-widest">
          <Lock className="w-4 h-4" />
          Encrypted Policy Storage Active
        </div>
      </div>
    </div>
  );
}
