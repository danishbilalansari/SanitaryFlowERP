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

export default function DefineRole() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    desc: '',
  });

  const handleCreateRole = async () => {
    if (!formData.name) {
      alert('Role name is required');
      return;
    }

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
        navigate('/settings');
      } else {
        alert('Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const modules = [
    { name: 'Inventory', icon: Package, view: true, edit: true, delete: false, export: true },
    { name: 'Production', icon: Factory, view: true, edit: true, delete: false, export: false },
    { name: 'Sales', icon: ShoppingCart, view: true, edit: false, delete: false, export: false },
    { name: 'Purchases', icon: ShoppingCart, view: true, edit: false, delete: false, export: false },
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
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/settings')}
            className="px-8 py-3 bg-white border border-[#c4c6cd] text-[#162839] font-bold rounded-xl hover:bg-neutral-50 transition-all text-[13px] uppercase tracking-widest shadow-sm"
          >
            Discard Changes
          </button>
          <button 
            onClick={handleCreateRole}
            className="bg-[#006397] text-white px-10 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg uppercase tracking-widest text-[13px]"
          >
            Save Role Class
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Role Identity */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-[#edeeef] pb-4">
              <BadgeCheck className="w-5 h-5 text-[#006397]" />
              <h3 className="text-[18px] font-bold text-[#162839]">Role Identity</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest block">Role Class Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Regional Floor Manager"
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest block">Description</label>
                <textarea 
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  placeholder="Define the primary responsibilities and scope of this role..."
                  rows={4}
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest block">Hierarchy Level</label>
                <div className="relative">
                  <select defaultValue="Level 3 - Supervisor (Departmental)" className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-bold text-[#162839] appearance-none outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all cursor-pointer">
                    <option>Level 1 - Administrative (Full Access)</option>
                    <option>Level 2 - Management (Operational)</option>
                    <option>Level 3 - Supervisor (Departmental)</option>
                    <option>Level 4 - Staff (Transactional)</option>
                  </select>
                  <ChevronRight className="w-4 h-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                </div>
              </div>
            </div>
          </section>

          {/* Administrative Overrides */}
          <section className="bg-white border border-[#edeeef] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-[#edeeef] pb-4">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h3 className="text-[18px] font-bold text-red-500">Administrative Overrides</h3>
            </div>
            <p className="text-[13px] text-neutral-400 font-medium mb-6">
              System-wide actions that bypass standard module restrictions. Use with extreme caution.
            </p>
            
            <div className="space-y-3">
              {[
                { label: 'Can bypass approval workflows' },
                { label: 'Can access audit logs' },
                { label: 'Can manage other users' }
              ].map((item, i) => (
                <label key={i} className="flex items-center justify-between p-5 bg-[#f8f9fa]/50 border border-[#edeeef] rounded-xl cursor-pointer hover:bg-neutral-50 transition-all group">
                  <span className="text-[14px] font-bold text-[#162839] group-hover:text-[#006397] transition-colors">{item.label}</span>
                  <input type="checkbox" className="w-5 h-5 rounded border-[#c4c6cd] text-[#006397] focus:ring-[#5cb8fd]" />
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Permissions Matrix */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="bg-white border border-[#edeeef] rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-[#edeeef] bg-[#f8f9fa]/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-[#006397]" />
                <h3 className="text-[20px] font-bold text-[#162839]">Module Permissions</h3>
              </div>
              <div className="flex gap-6">
                <button className="text-[12px] font-black uppercase tracking-widest text-[#006397] hover:underline transition-all">Select All</button>
                <button className="text-[12px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-all">Clear All</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f8f9fa] border-b border-[#edeeef]">
                  <tr className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">
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
                        <input type="checkbox" defaultChecked={mod.view} className="w-5 h-5 rounded border-[#c4c6cd] text-[#006397] focus:ring-[#5cb8fd]" />
                      </td>
                      <td className="px-8 py-6 text-center">
                        <input type="checkbox" defaultChecked={mod.edit} className="w-5 h-5 rounded border-[#c4c6cd] text-[#006397] focus:ring-[#5cb8fd]" />
                      </td>
                      <td className="px-8 py-6 text-center">
                        <input type="checkbox" defaultChecked={mod.delete} className="w-5 h-5 rounded border-[#c4c6cd] text-[#006397] focus:ring-[#5cb8fd]" />
                      </td>
                      <td className="px-8 py-6 text-center">
                        <input type="checkbox" defaultChecked={mod.export} className="w-5 h-5 rounded border-[#c4c6cd] text-[#006397] focus:ring-[#5cb8fd]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-[#f8f9fa]/50 border-t border-[#edeeef]">
              <div className="flex items-start gap-8">
                <div className="w-24 h-24 bg-white border border-[#edeeef] rounded-xl overflow-hidden shrink-0 shadow-sm">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYJPuUeWQ6uugHXNnvR_T7N6-II-d7xsOr3Z4PXFogtNtneSUiEr8uF5GIbvu6oAVlu3X7W98JIGma0xA9V8JDhiRVHPCC9suzWCurXWu0RuAwcncYDBqwP24U3FvJ8h_WxJL6MWt6z7NXjf9_X8nKToGPkIuZ13qQmJj9lWRjh9Vb7MmTLzmkMPqyuPXc7drJfk4MivPp3KCEFWjdL5DLWdAWQJdC140sXzpYFP5XdvhJqmQCU5YtAf1CGA40Bzb6PWO4OkAprN7i" 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-[#162839] mb-2">Permission Impact Preview</h4>
                  <p className="text-[13px] text-neutral-500 font-medium leading-relaxed">
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
