import { useState, useMemo } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  ClipboardList,
  Bell,
  Package,
  User,
  ChevronLeft,
  CheckCheck,
  Navigation,
  MessageSquare,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  Camera,
  X,
} from 'lucide-react';
import {
  type TaskWithRelations,
  type TaskStatus,
  type Product,
  type TaskMaterial,
  supabase,
  formatDateTime,
  formatCurrency,
} from '../lib/supabase';
import { pushToast } from './toast';
import { StatusBadge } from './ui';

export function MobileApp({
  taskRows,
  products,
  onRefresh,
}: {
  taskRows: TaskWithRelations[];
  products: Product[];
  onRefresh: () => Promise<void>;
}) {
  const [technicianName, setTechnicianName] = useState<string>('Kỹ thuật viên A - Trung tâm');
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      const distance = Math.min(diff * 0.4, 60);
      setPullDistance(distance);
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= 45) {
      setRefreshing(true);
      setPullDistance(45);
      try {
        await onRefresh();
        pushToast('Đã làm mới danh sách', 'success');
      } catch {
        pushToast('Lỗi khi làm mới', 'error');
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  const technicians = useMemo(
    () => Array.from(new Set(taskRows.map((t) => t.technician_name).filter(Boolean))) as string[],
    [taskRows],
  );

  const options = technicians.length > 0 ? technicians : [technicianName];

  const myTasks = useMemo(
    () => taskRows.filter((t) => t.technician_name === technicianName),
    [taskRows, technicianName],
  );

  const counts = useMemo(() => {
    const is = (s: TaskStatus) => myTasks.filter((t) => t.status === s).length;
    const newCount = is('assigned');
    const activeCount = is('accepted') + is('checked_in');
    const doneCount = is('completed') + is('verified');
    return { new: newCount, active: activeCount, done: doneCount, total: myTasks.length };
  }, [myTasks]);

  const newTasks = myTasks.filter((t) => t.status === 'assigned');
  const activeTasks = myTasks.filter(
    (t) => t.status === 'accepted' || t.status === 'checked_in' || t.status === 'checked_out',
  );
  const doneTasks = myTasks.filter((t) => t.status === 'completed' || t.status === 'verified');

  if (selectedTask) {
    return (
      <TaskDetailScreen
        task={taskRows.find((t) => t.id === selectedTask.id) || selectedTask}
        products={products}
        onBack={() => setSelectedTask(null)}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="h-full bg-slate-100 flex justify-center overflow-y-auto no-scrollbar select-none"
    >
      <div className="w-full max-w-[420px] bg-slate-50 min-h-full flex flex-col relative shadow-elev">
        {/* Pull-to-refresh indicator */}
        <div
          className="overflow-hidden transition-all duration-150 flex items-center justify-center bg-brand-50 text-brand-600 border-b border-brand-100 text-xs font-medium shrink-0"
          style={{ height: `${pullDistance}px`, opacity: pullDistance > 0 ? 1 : 0 }}
        >
          <div className="flex items-center gap-1.5 py-2">
            <RefreshCw size={13} className={`${refreshing || pullDistance >= 45 ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Đang cập nhật...' : pullDistance >= 45 ? 'Thả ra để làm mới' : 'Kéo xuống để làm mới'}</span>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-slate-900 text-white px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-medium shrink-0">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="flex gap-0.5">
              <span className="w-1 h-2 bg-white/90 rounded-full" />
              <span className="w-1 h-2 bg-white/90 rounded-full" />
              <span className="w-1 h-2 bg-white/90 rounded-full" />
              <span className="w-1 h-2 bg-white/40 rounded-full" />
            </span>
            <span>FieldTech</span>
            <span className="w-5 h-2 border border-white/70 rounded-sm relative">
              <span className="absolute inset-0.5 bg-white/80 rounded-[1px]" />
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white px-5 pt-4 pb-6 rounded-b-3xl shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70">Xin chào,</p>
              <h2 className="font-semibold text-lg leading-tight mt-0.5">
                {technicianName.replace('Kỹ thuật viên ', 'KT ')}
              </h2>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={async () => {
                  setRefreshing(true);
                  try {
                    await onRefresh();
                    pushToast('Đã làm mới danh sách', 'success');
                  } catch {
                    pushToast('Lỗi khi làm mới', 'error');
                  } finally {
                    setRefreshing(false);
                  }
                }}
                className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition flex items-center justify-center text-white"
                title="Làm mới"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                  <User size={20} />
                </div>
                {counts.new > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-brand-700 animate-scale-in">
                    {counts.new}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <StatPill label="Mới" value={counts.new} accent="bg-amber-400/90" />
            <StatPill label="Đang làm" value={counts.active} accent="bg-indigo-400/90" />
            <StatPill label="Hoàn thành" value={counts.done} accent="bg-emerald-400/90" />
          </div>
        </div>

        {/* Technician selector */}
        <div className="px-4 -mt-3">
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-3">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Đăng nhập với vai trò
            </label>
            <select
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              className="mt-1 w-full text-sm font-medium text-slate-800 bg-transparent focus:outline-none"
            >
              {options.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Task lists */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-5 no-scrollbar min-h-0">
          {counts.total === 0 && (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Bạn chưa có sự vụ nào được phân.</p>
            </div>
          )}

          {newTasks.length > 0 && (
            <Section title="Việc mới" count={newTasks.length} icon={Bell} accent="text-amber-600">
              {newTasks.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} showAccept />
              ))}
            </Section>
          )}

          {activeTasks.length > 0 && (
            <Section title="Đang xử lý" count={activeTasks.length} icon={Clock} accent="text-indigo-600">
              {activeTasks.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} showAccept />
              ))}
            </Section>
          )}

          {doneTasks.length > 0 && (
            <Section title="Hoàn thành" count={doneTasks.length} icon={CheckCircle2} accent="text-emerald-600">
              {doneTasks.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} showAccept />
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white/15 backdrop-blur rounded-xl p-2.5 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${accent}`} />
        <span className="text-xl font-bold leading-none">{value}</span>
      </div>
      <p className="text-[10px] text-white/80 mt-1">{label}</p>
    </div>
  );
}

function Section({
  title,
  count,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  count: number;
  icon: typeof Bell;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon size={15} className={accent} />
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
        <span className="text-[11px] text-slate-400">({count})</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TaskCard({
  task,
  onClick,
  showAccept,
}: {
  task: TaskWithRelations;
  onClick: () => void;
  showAccept?: boolean;
}) {
  const c = task.customers;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-card border border-slate-100 p-3.5 active:scale-[0.99] transition"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] text-slate-400">{task.code}</span>
        <StatusBadge status={task.status} />
      </div>
      <p className="text-sm font-semibold text-slate-800">{c?.name || 'Khách hàng'}</p>
      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {c?.region || '—'}
        </span>
        {task.products && (
          <span className="flex items-center gap-1">
            <Package size={11} />
            {task.products.name}
          </span>
        )}
      </div>
      {showAccept && task.status === 'assigned' && (
        <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600">
          Chạm để xem & tiếp nhận
          <ChevronLeft size={12} className="rotate-180" />
        </div>
      )}
    </button>
  );
}

import { useEffect as reactUseEffect } from 'react';

function TaskDetailScreen({
  task,
  products,
  onBack,
  onRefresh,
}: {
  task: TaskWithRelations;
  products: Product[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
}) {
  const c = task.customers;
  const [notes, setNotes] = useState(task.notes || '');
  const [busy, setBusy] = useState(false);

  // Materials state
  const [selectedMaterials, setSelectedMaterials] = useState<TaskMaterial[]>(
    task.materials || []
  );
  const [newMaterialId, setNewMaterialId] = useState<string>('');
  const [newMaterialQty, setNewMaterialQty] = useState<number>(1);
  const [savingMaterials, setSavingMaterials] = useState(false);

  reactUseEffect(() => {
    setSelectedMaterials(task.materials || []);
  }, [task.materials]);

  const addMaterial = () => {
    if (!newMaterialId) {
      pushToast('Vui lòng chọn vật tư', 'error');
      return;
    }
    const prod = products.find((p) => p.id === newMaterialId);
    if (!prod) return;

    const existing = selectedMaterials.find((m) => m.id === prod.id);
    if (existing) {
      setSelectedMaterials(
        selectedMaterials.map((m) =>
          m.id === prod.id ? { ...m, quantity: m.quantity + newMaterialQty } : m
        )
      );
    } else {
      setSelectedMaterials([
        ...selectedMaterials,
        {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          price: Number(prod.price),
          unit: prod.unit,
          quantity: newMaterialQty,
        },
      ]);
    }
    setNewMaterialId('');
    setNewMaterialQty(1);
    pushToast('Đã thêm vật tư', 'success');
  };

  const updateMaterialQty = (id: string, delta: number) => {
    setSelectedMaterials(
      selectedMaterials
        .map((m) => {
          if (m.id === id) {
            const nextQty = m.quantity + delta;
            return { ...m, quantity: Math.max(1, nextQty) };
          }
          return m;
        })
    );
  };

  const removeMaterial = (id: string) => {
    setSelectedMaterials(selectedMaterials.filter((m) => m.id !== id));
    pushToast('Đã xóa vật tư', 'success');
  };

  const saveMaterials = async () => {
    setSavingMaterials(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ materials: selectedMaterials })
        .eq('id', task.id);
      if (error) throw error;
      await onRefresh();
      pushToast('Đã lưu danh sách vật tư sử dụng', 'success');
    } catch {
      pushToast('Lỗi khi lưu vật tư.', 'error');
    } finally {
      setSavingMaterials(false);
    }
  };

  // Photos state
  const [photos, setPhotos] = useState<string[]>(task.photos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  reactUseEffect(() => {
    setPhotos(task.photos || []);
  }, [task.photos]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadingPhoto(true);

    const promises = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then(async (base64Strings) => {
        const updatedPhotos = [...photos, ...base64Strings];
        setPhotos(updatedPhotos);
        pushToast(`Đã thêm ${base64Strings.length} hình ảnh`, 'success');
        
        // Auto-save photos to Supabase for instant convenience
        try {
          const { error } = await supabase
            .from('tasks')
            .update({ photos: updatedPhotos })
            .eq('id', task.id);
          if (error) throw error;
          await onRefresh();
        } catch {
          // ignore error
        }
      })
      .catch(() => {
        pushToast('Lỗi khi đọc file ảnh', 'error');
      })
      .finally(() => {
        setUploadingPhoto(false);
      });
  };

  const removePhoto = async (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    pushToast('Đã gỡ ảnh', 'success');
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ photos: updatedPhotos })
        .eq('id', task.id);
      if (error) throw error;
      await onRefresh();
    } catch {
      // ignore error
    }
  };

  const updateTask = async (patch: Partial<TaskWithRelations>): Promise<boolean> => {
    setBusy(true);
    try {
      const { error } = await supabase.from('tasks').update(patch).eq('id', task.id);
      if (error) throw error;
      await onRefresh();
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    const ok = await updateTask({ status: 'accepted' });
    pushToast(ok ? 'Đã tiếp nhận sự vụ' : 'Không thể tiếp nhận, thử lại', ok ? 'success' : 'error');
  };

  const checkIn = async () => {
    const ok = await updateTask({ status: 'checked_in', check_in_at: new Date().toISOString() });
    pushToast(ok ? 'Đã check-in tại hiện trường' : 'Check-in thất bại, thử lại', ok ? 'success' : 'error');
  };

  const checkOut = async () => {
    const ok = await updateTask({ status: 'checked_out', check_out_at: new Date().toISOString() });
    pushToast(ok ? 'Đã check-out' : 'Check-out thất bại, thử lại', ok ? 'success' : 'error');
  };

  const saveNotes = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from('tasks').update({ notes }).eq('id', task.id);
      if (error) throw error;
      await onRefresh();
      pushToast('Đã lưu ghi chú', 'success');
    } catch {
      pushToast('Lỗi khi lưu ghi chú', 'error');
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    const ok = await updateTask({
      status: 'completed',
      notes: notes || task.notes,
    });
    pushToast(
      ok ? 'Đã báo cáo hoàn thành, Telesale sẽ nghiệm thu' : 'Lỗi khi báo cáo, thử lại',
      ok ? 'success' : 'error',
    );
  };

  const status = task.status;

  return (
    <div className="h-full bg-slate-100 flex justify-center overflow-hidden">
      <div className="w-full max-w-[420px] bg-slate-50 h-full flex flex-col relative shadow-elev">
        {/* Top bar */}
        <div className="bg-slate-900 text-white px-3 pt-3 pb-2 flex items-center justify-between text-[11px] font-medium">
          <span>9:41</span>
          <span>FieldTech</span>
          <span className="w-5 h-2 border border-white/70 rounded-sm" />
        </div>

        <div className="bg-white border-b border-slate-100 px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-lg hover:bg-slate-100 transition text-slate-600"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="font-mono text-[11px] text-slate-400">{task.code}</p>
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              Chi tiết sự vụ
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar min-h-0">
          {/* Customer card */}
          {c && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {c.name.split(' ').pop()?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <StatusBadge status={status} />
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center active:scale-95 transition"
                >
                  <Phone size={16} />
                </a>
              </div>
              <div className="space-y-2 pt-1">
                <DetailRow icon={MapPin} value={c.address || '—'} />
                <DetailRow icon={Navigation} value={c.region || '—'} />
                <DetailRow icon={Phone} value={c.phone || '—'} />
              </div>
            </div>
          )}

          {/* Task description */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <ClipboardList size={13} />
              Mô tả công việc
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">{task.description}</p>
            {task.products && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5">
                <Package size={13} className="text-slate-400" />
                {task.products.name}
              </div>
            )}
          </div>

          {/* Materials Section */}
          {(status === 'checked_in' || status === 'checked_out' || status === 'completed' || status === 'verified' || (selectedMaterials && selectedMaterials.length > 0)) && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Package size={13} />
                  Vật tư sử dụng
                </span>
                {selectedMaterials.reduce((sum, m) => sum + m.price * m.quantity, 0) > 0 && (
                  <span className="text-brand-600 font-bold normal-case">
                    Tổng: {formatCurrency(selectedMaterials.reduce((sum, m) => sum + m.price * m.quantity, 0))}
                  </span>
                )}
              </h4>

              {/* Editable form (only when status is checked_in or checked_out) */}
              {(status === 'checked_in' || status === 'checked_out') && (
                <div className="space-y-3 mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Thêm vật tư phụ tùng</div>
                  <div className="space-y-2">
                    <select
                      value={newMaterialId}
                      onChange={(e) => setNewMaterialId(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:border-brand-400"
                    >
                      <option value="">— Chọn vật tư —</option>
                      {products
                        .filter((p) => p.type === 'material') // Filter only material items
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.price)}/{p.unit})
                          </option>
                        ))}
                    </select>
                    
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 flex items-center justify-between border border-slate-200 bg-white rounded-lg px-2 py-1">
                        <span className="text-[11px] text-slate-500 font-medium">Số lượng:</span>
                        <div className="flex items-center">
                          <button
                            onClick={() => setNewMaterialQty(Math.max(1, newMaterialQty - 1))}
                            className="p-1 text-slate-500 hover:text-slate-700 active:scale-95 transition"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="text-xs font-semibold px-1 w-6 text-center">{newMaterialQty}</span>
                          <button
                            onClick={() => setNewMaterialQty(newMaterialQty + 1)}
                            className="p-1 text-slate-500 hover:text-slate-700 active:scale-95 transition"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={addMaterial}
                        className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg active:scale-95 transition shrink-0 flex items-center gap-1"
                      >
                        <Plus size={13} />
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Materials List */}
              <div className="space-y-2">
                {selectedMaterials.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Chưa chọn vật tư nào.</p>
                ) : (
                  selectedMaterials.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-slate-700 truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {m.sku ? `${m.sku} · ` : ''}{formatCurrency(m.price)}/{m.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {(status === 'checked_in' || status === 'checked_out') ? (
                          <div className="flex items-center border border-slate-100 bg-slate-50 rounded-md">
                            <button
                              onClick={() => updateMaterialQty(m.id, -1)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="font-medium text-slate-700 px-1 text-center min-w-[12px]">{m.quantity}</span>
                            <button
                              onClick={() => updateMaterialQty(m.id, 1)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">
                            x{m.quantity}
                          </span>
                        )}
                        <span className="font-semibold text-slate-700 min-w-[70px] text-right">
                          {formatCurrency(m.price * m.quantity)}
                        </span>
                        {(status === 'checked_in' || status === 'checked_out') && (
                          <button
                            onClick={() => removeMaterial(m.id)}
                            className="text-slate-300 hover:text-rose-500 p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Save Materials button (only if editable) */}
              {(status === 'checked_in' || status === 'checked_out') && (
                <button
                  onClick={saveMaterials}
                  disabled={savingMaterials}
                  className="mt-3 w-full bg-slate-900 hover:bg-black text-white text-xs font-semibold py-2 rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingMaterials ? <Spinner /> : null}
                  Lưu danh sách vật tư ({selectedMaterials.length})
                </button>
              )}
            </div>
          )}

          {/* Photos Section */}
          {(status === 'checked_in' || status === 'checked_out' || status === 'completed' || status === 'verified' || (photos && photos.length > 0)) && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera size={13} />
                  Hình ảnh hiện trường
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {photos.length} hình ảnh
                </span>
              </h4>

              {/* Upload input (only if checked_in or checked_out) */}
              {(status === 'checked_in' || status === 'checked_out') && (
                <div className="mb-3">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-4 cursor-pointer hover:bg-slate-50 transition">
                    <Camera size={20} className="text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-600">Chụp ảnh hoặc chọn ảnh</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ tải lên nhiều hình ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto || busy}
                      className="hidden"
                    />
                  </label>
                  {uploadingPhoto && (
                    <div className="text-center text-[10px] text-brand-600 font-medium py-1 animate-pulse">
                      Đang xử lý ảnh...
                    </div>
                  )}
                </div>
              )}

              {/* Photos List */}
              {photos.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Chưa chụp hình ảnh nào.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg border border-slate-100 overflow-hidden bg-slate-100 group">
                      <img src={url} alt={`Hiện trường ${idx + 1}`} className="w-full h-full object-cover" />
                      {(status === 'checked_in' || status === 'checked_out') && (
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition shadow-md"
                          title="Xóa ảnh"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Time tracking */}
          {(task.check_in_at || task.check_out_at) && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Clock size={13} />
                Theo dõi thời gian
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <TimeBox label="Check-in" time={task.check_in_at} icon={LogIn} active={!!task.check_in_at} />
                <TimeBox label="Check-out" time={task.check_out_at} icon={LogOut} active={!!task.check_out_at} />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <MessageSquare size={13} />
              Ghi chú hiện trường
            </h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi lại tình hình thực tế, vật tư sử dụng, ghi chú cho Telesale..."
              rows={3}
              className="w-full text-sm bg-slate-50 rounded-lg p-3 resize-none border border-transparent focus:border-brand-300 focus:outline-none focus:bg-white transition"
            />
            <button
              onClick={saveNotes}
              disabled={busy}
              className="mt-2 text-xs font-medium text-brand-600 disabled:opacity-50"
            >
              Lưu ghi chú
            </button>
          </div>

          {/* Report info when completed/verified */}
          {(status === 'completed' || status === 'verified') && (
            <div
              className={`rounded-2xl p-4 border ${
                status === 'verified'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-emerald-50 border-emerald-200'
              } flex items-start gap-3`}
            >
              <CheckCircle2 size={18} className={status === 'verified' ? 'text-green-600' : 'text-emerald-600'} />
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {status === 'verified' ? 'Sự vụ đã được nghiệm thu' : 'Đã báo cáo hoàn thành'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {status === 'verified'
                    ? 'Telesale đã xác nhận. Cảm ơn bạn!'
                    : 'Đang chờ Telesale nghiệm thu trên Web.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="bg-white border-t border-slate-100 p-3 space-y-2">
          {status === 'assigned' && (
            <button
              onClick={accept}
              disabled={busy}
              className="w-full bg-brand-600 text-white font-semibold py-3.5 rounded-xl active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? <Spinner /> : <CheckCircle2 size={18} />}
              Tiếp nhận sự vụ
            </button>
          )}
          {status === 'accepted' && (
            <button
              onClick={checkIn}
              disabled={busy}
              className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? <Spinner /> : <LogIn size={18} />}
              Check-in (đã đến hiện trường)
            </button>
          )}
          {status === 'checked_in' && (
            <>
              {task.check_in_at && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-600 py-1">
                  <span className="relative w-2 h-2 text-indigo-500 pulse-ring">
                    <span className="block w-2 h-2 rounded-full bg-indigo-500" />
                  </span>
                  Đang xử lý từ {formatDateTime(task.check_in_at)}
                </div>
              )}
              <button
                onClick={checkOut}
                disabled={busy}
                className="w-full bg-cyan-600 text-white font-semibold py-3.5 rounded-xl active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? <Spinner /> : <LogOut size={18} />}
                Check-out (rời hiện trường)
              </button>
            </>
          )}
          {status === 'checked_out' && (
            <button
              onClick={complete}
              disabled={busy}
              className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-xl active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? <Spinner /> : <CheckCheck size={18} />}
              Báo cáo hoàn thành
            </button>
          )}
          {(status === 'completed' || status === 'verified') && (
            <button
              onClick={onBack}
              className="w-full bg-slate-100 text-slate-700 font-semibold py-3.5 rounded-xl active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <ClipboardList size={18} />
              Về danh sách
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, value }: { icon: typeof MapPin; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-slate-700">
      <Icon size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
      <span className="leading-relaxed">{value}</span>
    </div>
  );
}

function Spinner() {
  return (
    <span className="w-[18px] h-[18px] border-2 border-white/40 border-t-white rounded-full animate-spin" />
  );
}

function TimeBox({
  label,
  time,
  icon: Icon,
  active,
}: {
  label: string;
  time: string | null;
  icon: typeof LogIn;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-2.5 border ${
        active ? 'bg-brand-50/50 border-brand-100' : 'bg-slate-50 border-slate-100'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={11} className={active ? 'text-brand-500' : ''} />
        {label}
      </div>
      <p className="text-xs font-medium text-slate-700 mt-0.5">
        {time ? formatDateTime(time) : '—'}
      </p>
    </div>
  );
}
