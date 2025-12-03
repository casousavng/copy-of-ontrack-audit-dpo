import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastMessage = { id: number; text: string; type?: 'success' | 'error' | 'info' };

type ToastContextType = {
  show: (text: string, type?: ToastMessage['type']) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now();
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              `px-4 py-2 rounded shadow text-sm ` +
              (m.type === 'success'
                ? 'bg-green-600 text-white'
                : m.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-white')
            }
          >
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
