import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, AlertTriangle, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    username: string;
    email?: string;
    role_name?: string;
  } | null;
  onConfirm: () => Promise<void> | void;
  loading: boolean;
}

export default function DeleteUserModal({
  isOpen,
  onClose,
  user,
  onConfirm,
  loading
}: DeleteUserModalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && user && (
        <div
          id="delete-user-modal-backdrop"
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="rounded-[32px] bg-white/[0.80] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.12),inset_0_1px_2px_rgba(255,255,255,1)] w-full max-w-md min-w-[320px] sm:min-w-[440px] p-6 sm:p-7 overflow-hidden flex flex-col relative z-10 m-auto"
          >
            {/* Header Pill & Action Circles (Modeled after image_93505ee0.png) */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[13px] font-semibold text-slate-800">
                  Delete Account · @{user.username}
                </span>
              </div>

              <button
                id="close-delete-user-modal"
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/90 border border-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[16px] font-bold text-slate-900">{user.name}</p>
                  {user.role_name && (
                    <span className="px-3 py-0.5 rounded-full bg-sky-100/85 text-sky-800 text-[11px] font-semibold">
                      # {user.role_name}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-slate-500 font-medium">
                  @{user.username} {user.email ? `• ${user.email}` : ''}
                </p>
              </div>

              <div className="rounded-2xl bg-white/90 border border-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                <div className="space-y-1">
                  <p className="text-[13.5px] font-semibold text-slate-900">
                    Are you sure you want to permanently remove {user.name}?
                  </p>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed">
                    This action cannot be undone. The user will immediately lose system access and all assigned permissions will be revoked.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-white/90 hover:bg-white border border-white text-[13.5px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-user-btn"
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-white/95 hover:bg-white border border-white text-[13.5px] font-semibold text-rose-600 shadow-[0_6px_18px_rgba(15,23,42,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-rose-500 stroke-[2.5]" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
