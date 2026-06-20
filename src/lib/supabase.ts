import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 5 } },
});

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  region: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  price: number;
  type: 'service' | 'material';
  created_at: string;
};

export type TaskStatus =
  | 'assigned'
  | 'accepted'
  | 'checked_in'
  | 'checked_out'
  | 'completed'
  | 'verified';

export type ServiceHistory = {
  id: string;
  customer_id: string;
  task_code: string | null;
  service_summary: string | null;
  performed_at: string;
  created_at: string;
};

export type TaskMaterial = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  unit: string;
  quantity: number;
};

export type Task = {
  id: string;
  code: string;
  customer_id: string | null;
  product_id: string | null;
  region: string | null;
  description: string;
  technician_name: string | null;
  status: TaskStatus;
  notes: string | null;
  materials: TaskMaterial[] | null;
  photos: string[] | null;
  check_in_at: string | null;
  check_out_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskWithRelations = Task & {
  customers: Customer | null;
  products: Product | null;
};

export type CustomerWithCounts = Customer & {
  task_count?: number;
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  assigned: 'Đã phân đơn',
  accepted: 'Đã tiếp nhận',
  checked_in: 'Đang xử lý',
  checked_out: 'Đã check-out',
  completed: 'Chờ nghiệm thu',
  verified: 'Đã hoàn thành',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  assigned: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-sky-100 text-sky-700 border-sky-200',
  checked_in: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  checked_out: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  verified: 'bg-green-100 text-green-700 border-green-200',
};

export const STATUS_DOT: Record<TaskStatus, string> = {
  assigned: 'bg-amber-500',
  accepted: 'bg-sky-500',
  checked_in: 'bg-indigo-500',
  checked_out: 'bg-cyan-500',
  completed: 'bg-emerald-500',
  verified: 'bg-green-600',
};

export const TECHNICIAN_REGIONS = [
  'Kỹ thuật viên A - Trung tâm',
  'Kỹ thuật viên B - Bình Thạnh',
  'Kỹ thuật viên C - Q.10',
];

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
}
