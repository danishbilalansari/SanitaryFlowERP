import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Copy, 
  Check, 
  X, 
  AlertCircle, 
  ShieldAlert,
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
            className="bg-white rounded-2xl shadow-2xl border border-[#edeeef] w-full max-w-md min-w-[320px] sm:min-w-[440px] overflow-hidden flex flex-col relative z-10 m-auto"
          >
            {/* Header */}
            <div className="bg-[#162839] px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[17px] tracking-tight">Reset User Password</h3>
                  <p className="text-[12px] text-[#96a9be]">Admin Override Action</p>
                </div>
              </div>
              <button 
                id="close-reset-password-modal"
                onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Target Banner */}
            <div className="bg-[#f8f9fa] border-b border-[#edeeef] px-6 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-[#162839]">{user.name}</p>
                <p className="text-[12px] text-neutral-400 font-medium">@{user.username} • {user.email}</p>
              </div>
              {user.role_name && (
                <span className="bg-[#cce5ff] text-[#006397] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                  {user.role_name}
                </span>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-[13px] animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-[#162839]" htmlFor="admin-new-password">
                  New User Password
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-bold text-[#006397] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Generate Random
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  id="admin-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 4 chars)"
                  required
                  className="w-full bg-[#f8f9fa] border border-[#d1d5db] rounded-xl pl-10 pr-20 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {newPassword && (
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="p-1.5 text-neutral-400 hover:text-[#006397] rounded-lg transition-colors"
                      title="Copy password"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-neutral-400 hover:text-[#162839] rounded-lg transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#162839]" htmlFor="admin-confirm-password">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    id="admin-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full bg-[#f8f9fa] border border-[#d1d5db] rounded-xl pl-10 pr-11 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-[12px]">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>Resetting will immediately update this user's password in the system. They will need the new password to log in.</span>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#edeeef]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 border border-[#d1d5db] text-[#162839] font-bold text-[13px] rounded-xl hover:bg-neutral-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  id="submit-reset-password-btn"
                  type="submit"
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[13px] rounded-xl active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Reset Password
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
