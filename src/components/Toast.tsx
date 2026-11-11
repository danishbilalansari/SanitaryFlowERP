import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useAppContext } from '../store';
import { motion, AnimatePresence } from 'motion/react';

export default function Toast() {
  const { toast, resolvedTheme } = useAppContext();
  const isDark = resolvedTheme === 'dark';

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return isDark
          ? 'bg-emerald-950/85 border-emerald-500/40 text-emerald-100 shadow-[0_14px_34px_rgba(0,0,0,0.65)]'
          : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-950 shadow-emerald-500/10';
      case 'error':
        return isDark
          ? 'bg-rose-950/85 border-rose-500/40 text-rose-100 shadow-[0_14px_34px_rgba(0,0,0,0.65)]'
          : 'bg-rose-500/15 border-rose-400/30 text-rose-950 shadow-rose-500/10';
      case 'info':
        return isDark
          ? 'bg-sky-950/85 border-sky-500/40 text-sky-100 shadow-[0_14px_34px_rgba(0,0,0,0.65)]'
          : 'bg-blue-500/15 border-blue-400/30 text-blue-950 shadow-blue-500/10';
      default:
        return isDark
          ? 'bg-zinc-900/90 border-white/15 text-slate-100 shadow-[0_14px_34px_rgba(0,0,0,0.65)]'
          : 'bg-white/80 border-white/60 text-slate-800 shadow-slate-900/10';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />;
      case 'error':
        return <XCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />;
      case 'info':
        return <Info className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {toast.type && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.92, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -16, scale: 0.94, filter: 'blur(6px)' }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-6 right-6 z-[9999]"
        >
          <div className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl border backdrop-blur-2xl shadow-xl ${getStyles()}`}>
            {getIcon()}
            <p className="text-[13.5px] font-semibold tracking-tight">{toast.message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
