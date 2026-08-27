import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Lock, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Eye,
  EyeOff
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
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl border border-[#edeeef] w-full max-w-lg min-w-[320px] sm:min-w-[480px] overflow-hidden flex flex-col relative z-10 m-auto"
          >
            {/* Header */}
            <div className="bg-[#162839] px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#5cb8fd]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[17px] tracking-tight">Edit User Account</h3>
                  <p className="text-[12px] text-[#96a9be]">Update profile, role, status & password</p>
                </div>
              </div>
              <button 
                id="close-edit-user-modal"
                onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-[13px] animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#162839]" htmlFor="edit-name">Full Name</label>
                  <input 
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-[#f8f9fa] border border-[#d1d5db] rounded-xl px-3.5 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#162839]" htmlFor="edit-username">Username</label>
                  <input 
                    id="edit-username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="w-full bg-[#f8f9fa] border border-[#d1d5db] rounded-xl px-3.5 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#162839]" htmlFor="edit-email">Email Address</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full bg-[#f8f9fa] border border-[#d1d5db] rounded-xl pl-10 pr-4 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#162839]" htmlFor="edit-role">System Role</label>
                  <select
                    id="edit-role"
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full bg-[#f8f9fa] border border-[#d1d5db] rounded-xl px-3.5 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#162839]" htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#f8f9fa] border border-[#d1d5db] rounded-xl px-3.5 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[13px] font-bold text-[#162839]" htmlFor="edit-password">
                  Change Password <span className="text-neutral-400 font-normal text-[12px]">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    id="edit-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep existing password"
                    className="w-full bg-[#f8f9fa] border border-[#d1d5db] rounded-xl pl-10 pr-11 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#162839]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#edeeef]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 border border-[#d1d5db] text-[#162839] font-bold text-[13px] rounded-xl hover:bg-neutral-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#162839] hover:bg-[#253e56] text-white font-bold text-[13px] rounded-xl active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save Changes
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
