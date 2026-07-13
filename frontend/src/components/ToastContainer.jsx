import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const toast = e.detail;
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 3000);
    };
    window.addEventListener('toast', handler);
    return () => window.removeEventListener('toast', handler);
  }, []);

  const getStyle = (type) => {
    switch (type) {
      case 'success': return 'bg-[#0F9D6D]';
      case 'error': return 'bg-[#C1443A]';
      case 'warning': return 'bg-[#C8933E]';
      default: return 'bg-[#17203A]';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <Check className="h-3 w-3" strokeWidth={3} />;
      case 'error': return <X className="h-3 w-3" strokeWidth={3} />;
      case 'warning': return <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />;
      default: return <Info className="h-3 w-3" strokeWidth={2.5} />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${getStyle(toast.type)} text-white pl-4 pr-3 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[260px] animate-slide-in`}
        >
          <span className="grid place-items-center h-5 w-5 rounded-full bg-white/20 shrink-0">
            {getIcon(toast.type)}
          </span>
          <span className="flex-1 text-sm">{toast.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="grid place-items-center h-5 w-5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );
}