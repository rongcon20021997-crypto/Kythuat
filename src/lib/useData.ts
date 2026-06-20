import { useEffect, useState, useCallback } from 'react';
import {
  supabase,
  type Customer,
  type Product,
  type Task,
  type TaskWithRelations,
  type ServiceHistory,
} from './supabase';

type DataService = {
  customers: Customer[];
  products: Product[];
  tasks: Task[];
  taskRows: TaskWithRelations[];
  history: ServiceHistory[];
  loading: boolean;
  error: string | null;
  refresh: (showLoading?: boolean) => Promise<void>;
};

export function useData(): DataService {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskRows, setTaskRows] = useState<TaskWithRelations[]>([]);
  const [history, setHistory] = useState<ServiceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const [c, p, t, h] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase
          .from('tasks')
          .select('*, customers(*), products(*)')
          .order('created_at', { ascending: false }),
        supabase.from('service_history').select('*').order('performed_at', { ascending: false }),
      ]);

      if (c.error) throw c.error;
      if (p.error) throw p.error;
      if (t.error) throw t.error;
      if (h.error) throw h.error;

      setCustomers(c.data as Customer[]);
      setProducts(p.data as Product[]);
      setTasks(t.data as Task[]);
      setTaskRows(t.data as TaskWithRelations[]);
      setHistory(h.data as ServiceHistory[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(true);

    const intervalId = setInterval(() => {
      fetchAll(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel('field-service-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchAll(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => fetchAll(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchAll(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_history' },
        () => fetchAll(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  return { customers, products, tasks, taskRows, history, loading, error, refresh: fetchAll };
}
