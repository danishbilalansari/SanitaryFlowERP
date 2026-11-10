import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Lock, 
  X, 
  AlertCircle, 
  Check, 
  Loader2,
  Eye,
  EyeOff,
  Factory,
  CreditCard,
  Users2,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
  roles: any[];
  onSuccess?: () => void;
}

const ROLE_ICON_MAP: Record<string, React.ElementType> = {
  admin: ShieldCheck,
  manager: Factory,
  accountant: CreditCard,
  operator: Users2,
  viewer: ShieldAlert,
};

export default function EditUserModal({ isOpen, onClose, user, roles, onSuccess }: EditUserModalProps) {
  const { showToast } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    role_id: '',
    status: 'Active',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        role_id: user.role_id || '',
        status: user.status || 'Active',
        password: ''
      });
      setErrorMsg('');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.role_id) {
      setErrorMsg('Please fill in Name, Email, and Role.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user profile');
      }

      showToast?.(`User ${formData.name} updated successfully!`, 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && user && (
        <div 
          id="edit-user-modal-backdrop"
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="rounded-[32px] bg-white/[0.80] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.12),inset_0_1px_2px_rgba(255,255,255,1)] w-full max-w-xl min-w-[320px] sm:min-w-[500px] p-6 sm:p-7 overflow-hidden flex flex-col relative z-10 m-auto"
          >
            {/* Top Header Pill & Action Circles (Modeled after image_93505ee0.png) */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
                <User className="w-3.5 h-3.5 text-[#0284c7]" />
                <span className="text-[13px] font-semibold text-slate-800">
                  Edit User · @{user.username}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      status: prev.status === 'Active' ? 'Deactivated' : 'Active'
                    }))
                  }
                  title={`Status: ${formData.status}`}
                  className={`px-3 py-1.5 rounded-full border text-[11.5px] font-semibold shadow-2xs transition-all cursor-pointer ${
                    formData.status === 'Active'
                      ? 'bg-amber-50/95 border-amber-200 text-amber-700'
                      : 'bg-white/90 border-white text-slate-500'
                  }`}
                >
                  {formData.status}
                </button>
                <button 
                  id="close-edit-user-modal"
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-[13px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Role Selector Row (Styled like the 5-card selector in image_93505ee0.png) */}
              <div>
                <label className="block text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-2.5">
                  SYSTEM ROLE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {roles.map((r) => {
                    const Icon = ROLE_ICON_MAP[r.id] || ShieldCheck;
                    const isSelected = formData.role_id === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, role_id: r.id })}
                        className={`rounded-2xl p-3 border transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-b from-amber-50/95 to-amber-100/75 border-amber-300/90 text-slate-900 shadow-[0_4px_14px_rgba(245,158,11,0.16)]'
                            : 'bg-white/85 hover:bg-white border-white text-slate-600 shadow-[0_2px_8px_rgba(15,23,42,0.03)]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-500' : 'text-[#0284c7]'}`} />
                        <span className="text-[11.5px] font-semibold leading-tight truncate max-w-full">
                          {r.name.replace('System ', '').replace('Factory ', '').replace('Senior ', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Hidden select for test/accessibility compatibility */}
                <select
                  id="edit-role"
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  className="sr-only"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Full Name Input */}
              <div>
                <input 
                  id="edit-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                  required
                  className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3.5 text-[15px] font-bold text-slate-900 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
                />
              </div>

              {/* Username & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/90 border border-white px-3.5 py-2.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sky-100/85 text-sky-800 text-[11px] font-semibold shrink-0">
                    # user
                  </span>
                  <input 
                    id="edit-username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Username"
                    required
                    className="w-full bg-transparent text-[13.5px] font-medium text-slate-800 outline-none"
                  />
                </div>

                <div className="rounded-2xl bg-white/90 border border-white px-3.5 py-2.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#0284c7] shrink-0" />
                  <input 
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email address"
                    required
                    className="w-full bg-transparent text-[13.5px] font-medium text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Optional Password Input */}
              <div className="relative">
                <input 
                  id="edit-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Optional: Enter new password (leave blank to keep current)"
                  className="w-full rounded-2xl bg-white/90 border border-white pl-4 pr-11 py-3.5 text-[13.5px] font-medium text-slate-800 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Bottom Pill Actions (Modeled after image_93505ee0.png) */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-white/90 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0284c7]" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#0284c7] stroke-[2.5]" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
