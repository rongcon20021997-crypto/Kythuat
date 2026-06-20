import { useState } from 'react';
import { Monitor, Smartphone, ShieldCheck } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { MobileApp } from './components/MobileApp';
import { ToastHost } from './components/toast';
import { useData } from './lib/useData';

type Tab = 'admin' | 'mobile';

function App() {
  const [tab, setTab] = useState<Tab>('admin');
  const { customers, products, taskRows, loading, error, refresh } = useData();


  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <ToastHost />

      {/* Top tab switcher */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <ShieldCheck size={17} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">FieldOps</p>
            <p className="text-[10px] text-slate-400 leading-tight">Quản lý dịch vụ hiện trường</p>
          </div>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => {
              setTab('admin');
              refresh();
            }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'admin'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Monitor size={16} />
            <span className="hidden sm:inline">Web Quản trị</span>
            <span className="sm:hidden">Admin</span>
          </button>
          <button
            onClick={() => {
              setTab('mobile');
              refresh();
            }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'mobile'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone size={16} />
            <span className="hidden sm:inline">Mobile App</span>
            <span className="sm:hidden">KT</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Live
        </div>
      </header>

      <div className="flex-1 overflow-hidden min-h-0">
        {tab === 'admin' ? (
          <AdminPanel
            customers={customers}
            products={products}
            taskRows={taskRows}
            loading={loading}
            error={error}
            onRefresh={refresh}
          />
        ) : (
          <MobileApp taskRows={taskRows} products={products} onRefresh={refresh} />
        )}
      </div>
    </div>
  );
}

export default App;
