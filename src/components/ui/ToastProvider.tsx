'use client';

import { useUIStore } from '@/store/useUIStore';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export function ToastProvider() {
  const { toasts, removeToast } = useUIStore();

  // Auto-dismiss functionality
  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, 5000);
      return () => clearTimeout(timer);
    });
  }, [toasts, removeToast]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`px-5 py-4 rounded-md shadow-2xl flex items-center justify-between gap-4 text-sm min-w-[300px] pointer-events-auto border
              ${toast.type === 'error' ? 'bg-[#2a1111] text-red-400 border-red-900/50' : 
                toast.type === 'success' ? 'bg-[#112a1f] text-green-400 border-green-900/50' : 
                'bg-ink text-canvas border-ink/20'}`}
          >
            <span className="font-medium tracking-wide">{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
