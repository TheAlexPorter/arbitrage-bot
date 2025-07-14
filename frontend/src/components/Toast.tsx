import React, { useState, useCallback, useEffect } from "react";
import type { Toast, ToastContextType } from "../hooks/useToast";
import { ToastContext, useToast } from "../hooks/useToast";

// Individual toast component
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getTypeStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-900/90 border-green-500 text-green-100";
      case "error":
        return "bg-red-900/90 border-red-500 text-red-100";
      case "warning":
        return "bg-yellow-900/90 border-yellow-500 text-yellow-100";
      case "info":
        return "bg-blue-900/90 border-blue-500 text-blue-100";
      default:
        return "bg-gray-900/90 border-gray-500 text-gray-100";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📝";
    }
  };

  return (
    <div
      className={`
        mb-3 p-4 rounded-lg border-l-4 shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-in-out
        ${getTypeStyles()}
        animate-slide-in-right
      `}
    >
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-3'>
          <span className='text-lg'>{getIcon()}</span>
          <div className='flex-1 min-w-0'>
            <h4 className='font-semibold text-sm'>{toast.title}</h4>
            {toast.message && <p className='text-xs mt-1 opacity-90'>{toast.message}</p>}
          </div>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className='ml-3 text-white/70 hover:text-white transition-colors text-lg leading-none'
          aria-label='Close notification'
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Toast container component
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className='fixed top-4 right-4 z-50 w-96 max-w-sm'>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => {
      addToast({ title, message, type: "success" });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      addToast({ title, message, type: "error" });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      addToast({ title, message, type: "warning" });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      addToast({ title, message, type: "info" });
    },
    [addToast]
  );

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};
