import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useAppContext } from '../store';
import { motion, AnimatePresence } from 'motion/react';

export default function Toast() {
  const { toast } = useAppContext();

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-neutral-50 border-neutral-200 text-neutral-800';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {toast.type && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[9999]"
        >
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-lg ${getStyles()}`}>
            {getIcon()}
            <p className="text-[13px] font-medium tracking-tight">{toast.message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
