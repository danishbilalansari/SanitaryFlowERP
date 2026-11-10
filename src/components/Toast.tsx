import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useAppContext } from '../store';
import { motion, AnimatePresence } from 'motion/react';

export default function Toast() {
  const { toast } = useAppContext();

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-500/15 border-emerald-400/30 text-emerald-950 shadow-emerald-500/10';
      case 'error':
        return 'bg-rose-500/15 border-rose-400/30 text-rose-950 shadow-rose-500/10';
      case 'info':
        return 'bg-blue-500/15 border-blue-400/30 text-blue-950 shadow-blue-500/10';
      default:
        return 'bg-white/80 border-white/60 text-slate-800 shadow-slate-900/10';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />;
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
