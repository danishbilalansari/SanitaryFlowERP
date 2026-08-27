import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
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
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl border border-[#edeeef] w-full max-w-md min-w-[320px] sm:min-w-[420px] overflow-hidden flex flex-col relative z-10 m-auto"
          >
            {/* Header */}
            <div className="bg-red-600 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[17px] tracking-tight">Delete User Account</h3>
                  <p className="text-[12px] text-red-100">Permanent removal</p>
                </div>
              </div>
              <button
                id="close-delete-user-modal"
                onClick={onClose}
                disabled={loading}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-[13px]">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-bold">This action cannot be undone.</p>
                  <p className="text-red-700 text-[12px] mt-0.5">The user will immediately lose access to the system and all permissions will be revoked.</p>
                </div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-[#edeeef] rounded-xl space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Target User</p>
                <p className="text-[15px] font-bold text-[#162839]">{user.name}</p>
                <p className="text-[13px] text-neutral-500 font-medium">@{user.username} {user.email ? `• ${user.email}` : ''}</p>
              </div>

              <p className="text-[14px] text-neutral-600">
                Are you sure you want to permanently delete <strong className="text-[#162839]">{user.name}</strong> from the system registry?
              </p>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#edeeef]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 border border-[#d1d5db] font-bold text-[13px] text-[#162839] rounded-xl hover:bg-neutral-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-user-btn"
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] rounded-xl active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Confirm Delete
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
