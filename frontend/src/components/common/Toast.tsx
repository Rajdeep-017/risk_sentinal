import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (title: string, message?: string, options?: Partial<Toast>) => string;
  error: (title: string, message?: string, options?: Partial<Toast>) => string;
  warning: (title: string, message?: string, options?: Partial<Toast>) => string;
  info: (title: string, message?: string, options?: Partial<Toast>) => string;
  toast: {
    success: (title: string, message?: string, options?: Partial<Toast>) => string;
    error: (title: string, message?: string, options?: Partial<Toast>) => string;
    warning: (title: string, message?: string, options?: Partial<Toast>) => string;
    info: (title: string, message?: string, options?: Partial<Toast>) => string;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} color="var(--risk-low)" />,
  error: <AlertCircle size={20} color="var(--risk-critical)" />,
  warning: <AlertTriangle size={20} color="var(--risk-moderate)" />,
  info: <Info size={20} color="var(--accent-primary)" />,
};

const toastStyles: Record<ToastType, React.CSSProperties> = {
  success: { borderLeftColor: 'var(--risk-low)' },
  error: { borderLeftColor: 'var(--risk-critical)' },
  warning: { borderLeftColor: 'var(--risk-moderate)' },
  info: { borderLeftColor: 'var(--accent-primary)' },
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  React.useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => handleRemove(), toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onRemove, toast.id]);

  return (
    <div
      style={{
        ...toastStyles[toast.type],
        backgroundColor: 'var(--bg-cards)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderLeftWidth: '4px',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        gap: '12px',
        minWidth: '320px',
        maxWidth: '480px',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.4)',
        animation: isExiting ? 'slideOutRight 0.2s ease forwards' : 'slideInRight 0.3s ease',
      }}
      role="alert"
      aria-live="polite"
    >
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{toastIcons[toast.type]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: toast.message ? '4px' : 0 }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            {toast.message}
          </div>
        )}
        {toast.action && (
          <button
            onClick={() => { toast.action?.onClick(); handleRemove(); }}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              backgroundColor: 'transparent',
              border: '1px solid var(--accent-primary)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      {toast.dismissible !== false && (
        <button
          onClick={handleRemove}
          style={{
            padding: '4px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  if (toasts.length === 0) return null;

  const container = (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(container, document.body) : null;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => 
    addToast({ type: 'success', title, message, ...options }), [addToast]);
  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => 
    addToast({ type: 'error', title, message, ...options }), [addToast]);
  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => 
    addToast({ type: 'warning', title, message, ...options }), [addToast]);
  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => 
    addToast({ type: 'info', title, message, ...options }), [addToast]);

  const toastMethods = useMemo(() => ({
    success,
    error,
    warning,
    info,
  }), [success, error, warning, info]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts, success, error, warning, info, toast: toastMethods }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};