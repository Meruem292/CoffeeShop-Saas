import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    show: (message: string, type: ToastType, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => show(message, 'success', duration), [show]);
  const error = useCallback((message: string, duration?: number) => show(message, 'error', duration), [show]);
  const info = useCallback((message: string, duration?: number) => show(message, 'info', duration), [show]);
  const warning = useCallback((message: string, duration?: number) => show(message, 'warning', duration), [show]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-sky-500 shrink-0" />;
    }
  };

  const getBgClass = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/20 text-slate-800 dark:text-emerald-200';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/20 border-red-500/20 text-slate-800 dark:text-red-200';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-500/20 text-slate-800 dark:text-amber-200';
      case 'info':
      default:
        return 'bg-sky-50 dark:bg-sky-950/20 border-sky-500/20 text-slate-800 dark:text-sky-200';
    }
  };

  return (
    <ToastContext.Provider value={{ toast: { success, error, info, warning, show } }}>
      {children}
      
      {/* Toast Container */}
      <div 
        id="toast-container"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-xl ${getBgClass(t.type)}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {getIcon(t.type)}
                <p className="text-xs font-bold leading-relaxed truncate-2-lines">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
