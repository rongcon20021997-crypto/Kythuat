import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type Toast = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

let counter = 0;
const listeners = new Set<(t: Toast) => void>();

export function pushToast(message: string, type: Toast['type'] = 'info') {
  const t: Toast = { id: `toast-${++counter}`, type, message };
  listeners.forEach((l) => l(t));
}

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setItems((prev) => [...prev, t]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, 3800);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const dismiss = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {items.map((t) => {
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info;
        const color =
          t.type === 'success'
            ? 'text-emerald-600 border-emerald-100'
            : t.type === 'error'
            ? 'text-rose-600 border-rose-100'
            : 'text-sky-600 border-sky-100';
        return (
          <div
            key={t.id}
            className={`bg-white border ${color} rounded-xl shadow-elev px-4 py-3 flex items-start gap-3 animate-slide-up`}
          >
            <Icon size={18} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-700 leading-relaxed flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-300 hover:text-slate-500 transition"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
