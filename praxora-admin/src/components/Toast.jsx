import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastSuccess = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const toastError = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const toastWarning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);
  const toastInfo = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, toastSuccess, toastError, toastWarning, toastInfo }}>
      {children}
      {/* Toast Container Accessible Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          let bg = 'bg-[#0D1017] border-[#252C3A] text-[#F3F5FA]';
          let Icon = Info;
          let iconColor = 'text-[#8B7CFF]';

          if (toast.type === 'success') {
            bg = 'bg-[#0D1017] border-[#48D6A0]/50 text-[#F3F5FA]';
            Icon = CheckCircle2;
            iconColor = 'text-[#48D6A0]';
          } else if (toast.type === 'error') {
            bg = 'bg-[#0D1017] border-[#FF6B78]/50 text-[#F3F5FA]';
            Icon = XCircle;
            iconColor = 'text-[#FF6B78]';
          } else if (toast.type === 'warning') {
            bg = 'bg-[#0D1017] border-[#F2BD69]/50 text-[#F3F5FA]';
            Icon = AlertTriangle;
            iconColor = 'text-[#F2BD69]';
          }

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${bg}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} aria-hidden="true" />
              <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 p-1 rounded-lg text-[#737E91] hover:text-[#F3F5FA] hover:bg-[#131722] transition-colors a11y-focus min-w-[28px] min-h-[28px] flex items-center justify-center"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
