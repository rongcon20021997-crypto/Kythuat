import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useEffect } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

export function Modal({ open, title, onClose, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxW} bg-white rounded-t-2xl sm:rounded-2xl shadow-elev animate-slide-up flex flex-col max-h-[92vh] sm:max-h-[85vh]`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">{children}</div>
        {footer && (
          <div className="border-t border-slate-100 px-5 py-3 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  full?: boolean;
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  className = '',
  full,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-1';
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-5 py-3',
  };
  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-300 shadow-sm shadow-brand-600/20',
    secondary:
      'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
    outline:
      'border border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-300 bg-white',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-300',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    assigned: 'Đã phân đơn',
    accepted: 'Đã tiếp nhận',
    checked_in: 'Đang xử lý',
    checked_out: 'Đã check-out',
    completed: 'Chờ nghiệm thu',
    verified: 'Đã hoàn thành',
  };
  const colors: Record<string, string> = {
    assigned: 'bg-amber-100 text-amber-700 border-amber-200',
    accepted: 'bg-sky-100 text-sky-700 border-sky-200',
    checked_in: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    checked_out: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    verified: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
        colors[status] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          {
            assigned: 'bg-amber-500',
            accepted: 'bg-sky-500',
            checked_in: 'bg-indigo-500 animate-pulse',
            checked_out: 'bg-cyan-500',
            completed: 'bg-emerald-500',
            verified: 'bg-green-600',
          }[status] || 'bg-slate-400'
        }`}
      />
      {labels[status] || status}
    </span>
  );
}
