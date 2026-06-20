import { useState, useMemo } from 'react';
import {
  Users,
  Package,
  ClipboardList,
  Plus,
  Search,
  Phone,
  MapPin,
  User as UserIcon,
  Trash2,
  CheckCircle2,
  Send,
  ShieldCheck,
  ListChecks,
  Boxes,
  LayoutGrid,
  Clock,
  ChevronRight,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';
import {
  type Customer,
  type Product,
  type TaskWithRelations,
  type TaskStatus,
  supabase,
  STATUS_LABELS,
  TECHNICIAN_REGIONS,
  formatDateTime,
  formatCurrency,
} from '../lib/supabase';
import { Button, Modal, StatusBadge } from './ui';
import { pushToast } from './toast';

type Section = 'dashboard' | 'customers' | 'products' | 'tasks' | 'verify';

export function AdminPanel({
  customers,
  products,
  taskRows,
  loading,
  error,
  onRefresh,
}: {
  customers: Customer[];
  products: Product[];
  taskRows: TaskWithRelations[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}) {
  const [section, setSection] = useState<Section>('dashboard');

  const nav: { id: Section; label: string; icon: typeof Users }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
    { id: 'tasks', label: 'Sự vụ & Phân đơn', icon: ClipboardList },
    { id: 'verify', label: 'Nghiệm thu', icon: ShieldCheck },
    { id: 'customers', label: 'Khách hàng', icon: Users },
    { id: 'products', label: 'Sản phẩm', icon: Package },
  ];

  return (
    <div className="flex h-full bg-slate-50">
      <aside className="w-20 lg:w-64 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center gap-3 px-4 lg:px-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold leading-tight">FieldOps Admin</p>
            <p className="text-[11px] text-slate-400">Telesale Console</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = section === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="hidden lg:inline">{n.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold">
              TS
            </div>
            <div>
              <p className="text-xs font-medium">Telesale Lead</p>
              <p className="text-[10px] text-slate-400">admin@fieldops.vn</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {nav.find((n) => n.id === section)?.label}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Hệ thống quản lý dịch vụ hiện trường
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <button
              onClick={async () => {
                await onRefresh();
                pushToast('Đã cập nhật dữ liệu mới nhất', 'success');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 active:scale-95 transition"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={13} className={`${loading ? 'animate-spin' : ''}`} />
              Tải lại
            </button>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đồng bộ thời gian thực</span>
            </div>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-20 text-slate-400">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
              <p className="text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <>
              {section === 'dashboard' && (
                <Dashboard customers={customers} products={products} taskRows={taskRows} />
              )}
              {section === 'customers' && <CustomersSection customers={customers} onRefresh={onRefresh} />}
              {section === 'products' && <ProductsSection products={products} onRefresh={onRefresh} />}
              {section === 'tasks' && (
                <TasksSection
                  taskRows={taskRows}
                  customers={customers}
                  products={products}
                  onRefresh={onRefresh}
                />
              )}
              {section === 'verify' && <VerifySection taskRows={taskRows} onRefresh={onRefresh} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function Dashboard({
  customers,
  products,
  taskRows,
}: {
  customers: Customer[];
  products: Product[];
  taskRows: TaskWithRelations[];
}) {
  const stats = useMemo(() => {
    const byStatus: Record<TaskStatus, number> = {
      assigned: 0,
      accepted: 0,
      checked_in: 0,
      checked_out: 0,
      completed: 0,
      verified: 0,
    };
    taskRows.forEach((t) => (byStatus[t.status] += 1));
    return {
      total: taskRows.length,
      pending: byStatus.assigned + byStatus.accepted + byStatus.checked_in + byStatus.checked_out,
      verify: byStatus.completed,
      verified: byStatus.verified,
      byStatus,
    };
  }, [taskRows]);

  const cards = [
    {
      label: 'Tổng sự vụ',
      value: stats.total,
      icon: ClipboardList,
      tint: 'bg-brand-50 text-brand-600',
    },
    {
      label: 'Đang xử lý',
      value: stats.pending,
      icon: Clock,
      tint: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Chờ nghiệm thu',
      value: stats.verify,
      icon: ShieldCheck,
      tint: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Khách hàng',
      value: customers.length,
      icon: Users,
      tint: 'bg-sky-50 text-sky-600',
    },
  ];

  const pipeline = Object.entries(STATUS_LABELS).map(([k, label]) => ({
    key: k as TaskStatus,
    label,
    count: stats.byStatus[k as TaskStatus],
    color: {
      assigned: 'bg-amber-500',
      accepted: 'bg-sky-500',
      checked_in: 'bg-indigo-500',
      checked_out: 'bg-cyan-500',
      completed: 'bg-emerald-500',
      verified: 'bg-green-600',
    }[k as TaskStatus],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-elev transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">{c.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1.5">{c.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.tint}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Pipeline sự vụ</h3>
          </div>
          <div className="space-y-3">
            {pipeline.map((p) => {
              const pct = stats.total > 0 ? (p.count / stats.total) * 100 : 0;
              return (
                <div key={p.key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">{p.label}</span>
                    <span className="text-slate-400">{p.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${p.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Hoạt động gần đây</h3>
          </div>
          <div className="space-y-3">
            {taskRows.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {t.code} · {t.customers?.name || 'Khách hàng'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{t.description}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
            {taskRows.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Chưa có sự vụ nào</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-6 text-white shadow-elev">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Boxes size={22} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Tổng quan hệ thống</h3>
            <p className="text-sm text-white/80 mt-1">
              {products.length} dịch vụ/sản phẩm · {stats.verified} sự vụ đã nghiệm thu
            </p>
            <p className="text-xs text-white/60 mt-3">
              Telesale tạo đơn → phân khu vực → Kỹ thuật viên nhận việc trên App → báo cáo hoàn thành → Telesale nghiệm thu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Customers ---------- */
function CustomersSection({ customers, onRefresh }: { customers: Customer[]; onRefresh: () => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.includes(query) ||
      c.region?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm khách hàng, số điện thoại, khu vực..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition"
          />
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus size={16} />
          Thêm khách hàng
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="text-left font-semibold px-4 py-3">Khách hàng</th>
              <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Liên hệ</th>
              <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Địa chỉ</th>
              <th className="text-left font-semibold px-4 py-3">Khu vực</th>
              <th className="text-right font-semibold px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelected(c)}
                className="hover:bg-slate-50 cursor-pointer transition"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {c.name.split(' ').pop()?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400 md:hidden">{c.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{c.address || '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-block text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                    {c.region || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight size={16} className="text-slate-300 inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Chưa có khách hàng nào.
          </div>
        )}
      </div>

      {adding && <CustomerForm onRefresh={onRefresh} onClose={() => setAdding(false)} />}
      {selected && (
        <CustomerDetail
          customer={selected}
          onRefresh={onRefresh}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function CustomerForm({ onRefresh, onClose }: { onRefresh: () => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    region: '',
  });
  const [saving, setSaving] = useState(false);

  const regions = [
    'TP.HCM - Trung tâm',
    'TP.HCM - Bình Thạnh',
    'TP.HCM - Q.10',
    'TP.HCM - Q.7',
    'TP.HCM - Thủ Đức',
  ];

  const submit = async () => {
    if (!form.name.trim()) {
      pushToast('Vui lòng nhập tên khách hàng', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('customers').insert(form);
      if (error) throw error;
      pushToast('Đã thêm khách hàng mới', 'success');
      await onRefresh();
      onClose();
    } catch {
      pushToast('Lỗi khi thêm khách hàng', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Thêm khách hàng"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Họ và tên" required>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nguyễn Văn A"
            className={inputCls}
          />
        </Field>
        <Field label="Số điện thoại">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0901 234 567"
            className={inputCls}
          />
        </Field>
        <Field label="Địa chỉ">
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Số nhà, đường, quận"
            className={inputCls}
          />
        </Field>
        <Field label="Khu vực">
          <select
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className={inputCls}
          >
            <option value="">— Chọn khu vực —</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

function CustomerDetail({ customer, onRefresh, onClose }: { customer: Customer; onRefresh: () => Promise<void>; onClose: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const remove = async () => {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', customer.id);
      if (error) throw error;
      pushToast('Đã xóa khách hàng', 'success');
      await onRefresh();
      onClose();
    } catch {
      pushToast('Lỗi khi xóa khách hàng', 'error');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Thông tin khách hàng"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} />
            Xóa
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-lg font-semibold">
            {customer.name.split(' ').pop()?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{customer.name}</h3>
            <p className="text-xs text-slate-400">Khách hàng từ {formatDateTime(customer.created_at)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <InfoRow icon={Phone} label="Điện thoại" value={customer.phone || '—'} />
          <InfoRow icon={MapPin} label="Địa chỉ" value={customer.address || '—'} />
          <InfoRow icon={UserIcon} label="Khu vực" value={customer.region || '—'} />
        </div>
      </div>
      {confirmDelete && (
        <Modal
          open
          onClose={() => setConfirmDelete(false)}
          title="Xác nhận xóa"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Hủy
              </Button>
              <Button variant="danger" onClick={remove}>
                Xóa vĩnh viễn
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Bạn có chắc muốn xóa khách hàng <b>{customer.name}</b>? Hành động không thể hoàn tác.
          </p>
        </Modal>
      )}
    </Modal>
  );
}

/* ---------- Products ---------- */
function ProductsSection({ products, onRefresh }: { products: Product[]; onRefresh: () => Promise<void> }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {products.length} dịch vụ / vật tư kinh doanh
        </p>
        <Button onClick={() => setAdding(true)}>
          <Plus size={16} />
          Thêm sản phẩm
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-elev transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Package size={18} />
              </div>
              <div className="flex gap-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  p.type === 'service' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  {p.type === 'service' ? 'Dịch vụ' : 'Vật tư'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                  {p.sku || '—'}
                </span>
              </div>
            </div>
            <h3 className="font-medium text-slate-800 text-sm leading-snug">{p.name}</h3>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-lg font-bold text-slate-900">{formatCurrency(p.price)}</p>
              <span className="text-xs text-slate-400">/ {p.unit}</span>
            </div>
          </div>
        ))}
      </div>
      {adding && <ProductForm onRefresh={onRefresh} onClose={() => setAdding(false)} />}
    </div>
  );
}

function ProductForm({ onRefresh, onClose }: { onRefresh: () => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', sku: '', unit: 'sự vụ', price: '0', type: 'service' as 'service' | 'material' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) {
      pushToast('Vui lòng nhập tên sản phẩm', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('products').insert({
        name: form.name,
        sku: form.sku || null,
        unit: form.unit,
        price: Number(form.price) || 0,
        type: form.type,
      });
      if (error) throw error;
      pushToast('Đã thêm sản phẩm', 'success');
      await onRefresh();
      onClose();
    } catch {
      pushToast('Lỗi khi thêm sản phẩm', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Thêm dịch vụ / sản phẩm / vật tư"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Tên dịch vụ / sản phẩm / vật tư" required>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Bảo trì máy lạnh hoặc Van gas"
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phân loại">
            <select
              value={form.type}
              onChange={(e) => {
                const nextType = e.target.value as 'service' | 'material';
                setForm({
                  ...form,
                  type: nextType,
                  unit: nextType === 'service' ? 'sự vụ' : 'cái',
                });
              }}
              className={inputCls}
            >
              <option value="service">Dịch vụ chính</option>
              <option value="material">Vật tư phụ tùng</option>
            </select>
          </Field>
          <Field label="Mã SKU">
            <input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="AC-MANT"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Đơn vị">
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className={inputCls}
            >
              {form.type === 'service' ? (
                <>
                  <option value="sự vụ">sự vụ</option>
                  <option value="giờ">giờ</option>
                </>
              ) : (
                <>
                  <option value="cái">cái</option>
                  <option value="mét">mét</option>
                  <option value="hộp">hộp</option>
                  <option value="cuộn">cuộn</option>
                  <option value="bộ">bộ</option>
                </>
              )}
            </select>
          </Field>
          <Field label="Đơn giá (VND)">
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Tasks & Dispatch ---------- */
function TasksSection({
  taskRows,
  customers,
  products,
  onRefresh,
}: {
  taskRows: TaskWithRelations[];
  customers: Customer[];
  products: Product[];
  onRefresh: () => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [selected, setSelected] = useState<TaskWithRelations | null>(null);

  const filtered = filter === 'all' ? taskRows : taskRows.filter((t) => t.status === filter);

  const tabs: { id: TaskStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'assigned', label: STATUS_LABELS.assigned },
    { id: 'accepted', label: STATUS_LABELS.accepted },
    { id: 'checked_in', label: STATUS_LABELS.checked_in },
    { id: 'checked_out', label: STATUS_LABELS.checked_out },
    { id: 'completed', label: STATUS_LABELS.completed },
    { id: 'verified', label: STATUS_LABELS.verified },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                filter === t.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} />
          Tạo sự vụ
        </Button>
      </div>

      <div className="grid gap-3">
        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelected(t)}
            className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-elev transition cursor-pointer p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <PackageCheck size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-400">{t.code}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-sm font-medium text-slate-800 mt-1 truncate">
                    {t.customers?.name || '—'}
                    {t.customers?.region && (
                      <span className="text-xs text-slate-400 font-normal">
                        {' '}
                        · {t.customers.region}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-[11px] text-slate-400">Kỹ thuật viên</p>
                <p className="text-xs font-medium text-slate-600">
                  {t.technician_name || 'Chưa phân'}
                </p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-200">
            Chưa có sự vụ nào trong mục này.
          </div>
        )}
      </div>

      {creating && (
        <TaskForm
          customers={customers}
          products={products}
          onRefresh={onRefresh}
          onClose={() => setCreating(false)}
        />
      )}
      {selected && <TaskDetail task={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function TaskForm({
  customers,
  products,
  onRefresh,
  onClose,
}: {
  customers: Customer[];
  products: Product[];
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    customerId: '',
    productId: '',
    technician: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const technicianOptions = useMemo(() => {
    const region = selectedCustomer?.region;
    if (region) {
      const match = TECHNICIAN_REGIONS.find((t) => t.includes(region.split('-')[1]?.trim() || ''));
      if (match) return [match, ...TECHNICIAN_REGIONS.filter((t) => t !== match)];
    }
    return TECHNICIAN_REGIONS;
  }, [selectedCustomer]);

  const submit = async () => {
    if (!form.customerId || !form.description.trim()) {
      pushToast('Vui lòng chọn khách hàng và mô tả sự vụ', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('tasks')
        .select('code')
        .order('code', { ascending: false })
        .limit(1);
      const lastNum = existing?.[0]?.code.match(/(\d+)$/)?.[1];
      const nextNum = lastNum ? parseInt(lastNum, 10) + 1 : 1001;
      const code = `TS-${nextNum}`;

      const { error } = await supabase.from('tasks').insert({
        code,
        customer_id: form.customerId,
        product_id: form.productId || null,
        region: selectedCustomer?.region || null,
        description: form.description,
        technician_name: form.technician || null,
        status: form.technician ? 'assigned' : 'assigned',
      });
      if (error) throw error;
      pushToast(`Đã tạo sự vụ ${code} và phân đơn`, 'success');
      await onRefresh();
      onClose();
    } catch {
      pushToast('Lỗi khi tạo sự vụ', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Tạo sự vụ & phân đơn"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={saving}>
            <Send size={15} />
            {saving ? 'Đang tạo...' : 'Tạo & Phân đơn'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Khách hàng" required>
          <select
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            className={inputCls}
          >
            <option value="">— Chọn khách hàng —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.region || 'Chưa rõ khu vực'}
              </option>
            ))}
          </select>
        </Field>

        {selectedCustomer && (
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2 animate-fade-in">
            <MapPin size={14} className="mt-0.5 text-slate-400 flex-shrink-0" />
            <div>
              <p>{selectedCustomer.address || '—'}</p>
              <p className="text-slate-400 mt-0.5">Khu vực: {selectedCustomer.region || '—'}</p>
            </div>
          </div>
        )}

        <Field label="Dịch vụ / Sản phẩm">
          <select
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            className={inputCls}
          >
            <option value="">— Không chỉ định —</option>
            {products
              .filter((p) => p.type === 'service')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {formatCurrency(p.price)}/{p.unit}
                </option>
              ))}
          </select>
        </Field>

        <Field label="Kỹ thuật viên phụ trách" hint="Đề xuất theo khu vực của khách hàng">
          <select
            value={form.technician}
            onChange={(e) => setForm({ ...form, technician: e.target.value })}
            className={inputCls}
          >
            <option value="">— Chọn kỹ thuật viên —</option>
            {technicianOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mô tả sự vụ" required>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả công việc cần xử lý..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>
    </Modal>
  );
}

function TaskDetail({ task, onClose }: { task: TaskWithRelations; onClose: () => void }) {
  const c = task.customers;
  const p = task.products;
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  return (
    <Modal open onClose={onClose} title={`Sự vụ ${task.code}`} size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <StatusBadge status={task.status} />
          <span className="text-xs text-slate-400">Tạo: {formatDateTime(task.created_at)}</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-sm text-slate-700 leading-relaxed">{task.description}</p>
        </div>

        {c && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Khách hàng
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={UserIcon} label="Tên" value={c.name} />
              <InfoRow icon={Phone} label="Điện thoại" value={c.phone || '—'} />
              <InfoRow icon={MapPin} label="Địa chỉ" value={c.address || '—'} />
              <InfoRow icon={UserIcon} label="Khu vực" value={c.region || '—'} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <InfoRow icon={UserIcon} label="Kỹ thuật viên" value={task.technician_name || '—'} />
          {p && <InfoRow icon={Package} label="Dịch vụ" value={p.name} />}
          <InfoRow icon={Clock} label="Check-in" value={formatDateTime(task.check_in_at)} />
          <InfoRow icon={Clock} label="Check-out" value={formatDateTime(task.check_out_at)} />
        </div>

        {task.materials && task.materials.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Vật tư sử dụng
            </h4>
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 text-left border-b border-slate-200/60 pb-1.5">
                    <th className="pb-1.5 font-medium text-left">Tên vật tư</th>
                    <th className="pb-1.5 font-medium text-center w-16">Số lượng</th>
                    <th className="pb-1.5 font-medium text-right w-24">Đơn giá</th>
                    <th className="pb-1.5 font-medium text-right w-28">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {task.materials.map((m) => (
                    <tr key={m.id} className="text-slate-700">
                      <td className="py-2 text-left font-medium">{m.name} {m.sku ? `(${m.sku})` : ''}</td>
                      <td className="py-2 text-center font-semibold">x{m.quantity}</td>
                      <td className="py-2 text-right text-slate-500">{formatCurrency(m.price)}/{m.unit}</td>
                      <td className="py-2 text-right font-semibold">{formatCurrency(m.price * m.quantity)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t border-slate-200 text-slate-900">
                    <td className="pt-2.5 text-right text-xs" colSpan={3}>Tổng cộng vật tư:</td>
                    <td className="pt-2.5 text-right text-sm text-brand-600">
                      {formatCurrency(task.materials.reduce((sum, m) => sum + m.price * m.quantity, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {task.photos && task.photos.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Hình ảnh hiện trường
            </h4>
            <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200/60 rounded-xl p-4">
              {task.photos.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePhoto(url)}
                  className="relative aspect-video rounded-lg border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer hover:opacity-90 active:scale-95 transition group"
                >
                  <img src={url} alt={`Hiện trường ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            
            {activePhoto && (
              <Modal open onClose={() => setActivePhoto(null)} title="Hình ảnh chi tiết" size="lg">
                <div className="flex justify-center bg-black/5 rounded-xl overflow-hidden p-2">
                  <img src={activePhoto} alt="Chi tiết hiện trường" className="max-h-[60vh] object-contain rounded-lg shadow-elev" />
                </div>
              </Modal>
            )}
          </div>
        )}

        {task.notes && (
          <div className="border-l-2 border-brand-300 bg-brand-50/40 p-3 rounded-r-lg">
            <p className="text-[11px] font-semibold text-brand-700 uppercase mb-1">
              Ghi chú từ kỹ thuật viên
            </p>
            <p className="text-sm text-slate-700">{task.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ---------- Verify ---------- */
function VerifySection({ taskRows, onRefresh }: { taskRows: TaskWithRelations[]; onRefresh: () => Promise<void> }) {
  const pending = taskRows.filter((t) => t.status === 'completed');
  const verified = taskRows.filter((t) => t.status === 'verified');

  const verify = async (t: TaskWithRelations) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'verified' })
        .eq('id', t.id);
      if (error) throw error;

      if (t.customer_id) {
        await supabase.from('service_history').insert({
          customer_id: t.customer_id,
          task_code: t.code,
          service_summary: `${t.products?.name || 'Sự vụ'}: ${t.notes?.slice(0, 80) || t.description}`.trim(),
        });
      }
      pushToast(`Đã nghiệm thu sự vụ ${t.code}`, 'success');
      await onRefresh();
    } catch {
      pushToast('Lỗi khi nghiệm thu', 'error');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">Chờ nghiệm thu ({pending.length})</h3>
        </div>
        <div className="space-y-3">
          {pending.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-emerald-200/60 shadow-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-400">{t.code}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-sm font-medium text-slate-800 mt-1">
                      {t.customers?.name || '—'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                    {t.notes && (
                      <p className="text-xs text-slate-600 mt-2 italic bg-slate-50 rounded px-2 py-1.5">
                        "{t.notes}"
                      </p>
                    )}
                    {t.materials && t.materials.length > 0 && (
                      <div className="mt-2 text-xs bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                        <p className="font-semibold text-slate-500 mb-1 flex justify-between">
                          <span>Vật tư phụ tùng:</span>
                          <span className="text-brand-600">
                            Tổng: {formatCurrency(t.materials.reduce((sum, m) => sum + m.price * m.quantity, 0))}
                          </span>
                        </p>
                        <div className="space-y-0.5 text-[11px] text-slate-600">
                          {t.materials.map((m) => (
                            <div key={m.id} className="flex justify-between">
                              <span>· {m.name} (x{m.quantity})</span>
                              <span className="font-medium">{formatCurrency(m.price * m.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {t.photos && t.photos.length > 0 && (
                      <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {t.photos.map((url, idx) => (
                          <div key={idx} className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0">
                            <img src={url} alt={`Hiện trường ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    {t.check_in_at && t.check_out_at && (
                      <p className="text-[11px] text-slate-400 mt-2">
                        {formatDateTime(t.check_in_at)} → {formatDateTime(t.check_out_at)}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="success" size="sm" onClick={() => verify(t)}>
                  <ShieldCheck size={14} />
                  Nghiệm thu
                </Button>
              </div>
            </div>
          ))}
          {pending.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-200">
              Không có sự vụ nào chờ nghiệm thu.
            </div>
          )}
        </div>
      </div>

      {verified.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">
              Đã hoàn thành ({verified.length})
            </h3>
          </div>
          <div className="space-y-2">
            {verified.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-slate-200 shadow-card p-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    <span className="font-mono text-xs text-slate-400">{t.code}</span>
                    {' · '}
                    {t.customers?.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{t.description}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Shared smaller components ---------- */
function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2">
      <Icon size={15} className="text-slate-400 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition';
