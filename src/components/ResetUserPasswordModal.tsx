import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Copy, 
  Check, 
  X, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store';

interface ResetUserPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
    role_name?: string;
  } | null;
  onSuccess?: () => void;
}

export default function ResetUserPasswordModal({ isOpen, onClose, user, onSuccess }: ResetUserPasswordModalProps) {
  const { showToast } = useAppContext();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setConfirmPassword(pass);
    setShowPassword(true);
  };

  const copyToClipboard = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    showToast?.('Password copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) return;

    if (!newPassword) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset user password');
      }

      showToast?.(`Password for ${user.name} reset successfully!`, 'success');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && user && (
        <div 
          id="reset-user-password-backdrop"
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
            className="rounded-[32px] bg-white/[0.80] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.12),inset_0_1px_2px_rgba(255,255,255,1)] w-full max-w-md min-w-[320px] sm:min-w-[450px] p-6 sm:p-7 overflow-hidden flex flex-col relative z-10 m-auto"
          >
            {/* Header Pill & Action Circles (Modeled after image_93505ee0.png) */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
                <KeyRound className="w-3.5 h-3.5 text-[#0284c7]" />
                <span className="text-[13px] font-semibold text-slate-800">
                  Reset Password · @{user.username}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  title="Generate random password"
                  className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-[#0284c7] hover:scale-105 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button 
                  id="close-reset-password-modal"
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* User Info Pill Row */}
            <div className="rounded-2xl bg-white/90 border border-white px-4 py-3 mb-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[14.5px] font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[12px] text-slate-500 truncate">{user.email}</p>
              </div>
              {user.role_name && (
                <span className="px-3 py-1 rounded-full bg-sky-100/85 text-sky-800 text-[11px] font-semibold shrink-0">
                  # {user.role_name}
                </span>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-[13px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase" htmlFor="admin-new-password">
                    NEW PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11.5px] font-semibold text-[#0284c7] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Auto-generate
                  </button>
                </div>
                <div className="relative">
                  <input 
                    id="admin-new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 4 chars)"
                    required
                    className="w-full rounded-2xl bg-white/90 border border-white pl-4 pr-20 py-3.5 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {newPassword && (
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="p-1.5 text-slate-400 hover:text-[#0284c7] rounded-lg transition-colors"
                        title="Copy password"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase" htmlFor="admin-confirm-password">
                  CONFIRM PASSWORD
                </label>
                <input 
                  id="admin-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full rounded-2xl bg-white/90 border border-white px-4 py-3.5 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
                />
              </div>

              {/* Actions */}
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
                  id="submit-reset-password-btn"
                  type="submit"
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                  className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0284c7]" />
                      <span>Resetting...</span>
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
