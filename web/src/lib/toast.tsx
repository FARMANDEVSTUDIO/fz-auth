'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  removing?: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: ToastItem['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons: Record<string, string> = {
  success: 'ri-checkbox-circle-fill',
  error: 'ri-error-warning-fill',
  info: 'ri-information-fill',
  warning: 'ri-alert-fill',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 250);
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-${t.type} ${t.removing ? 'animate-toast-out' : 'animate-toast-in'}
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium shadow-lg max-w-sm pointer-events-auto`}
          >
            <i className={`${icons[t.type]} text-base`} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
