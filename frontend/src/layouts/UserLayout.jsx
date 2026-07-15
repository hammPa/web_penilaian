import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, History, LogOut } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/assessments', label: 'Riwayat', icon: History },
];

export default function UserLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  let activeLabel = 'Dashboard';
  if (location.pathname === '/assessment/new') {
    activeLabel = 'Form Penilaian';
  } else if (location.pathname.startsWith('/assessments/')) {
    activeLabel = 'Detail Penilaian';
  } else {
    activeLabel = navItems.find(i => i.path === location.pathname)?.label || 'Dashboard';
  }

  return (
    <div className="flex h-screen bg-[#F3F4F7]">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-64 bg-[#17203A] text-white flex-col">
        <div className="p-5 border-b border-white/10">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Sistem Penilaian</p>
          <h1 className="font-serif text-xl font-semibold mt-0.5">Panel Penilai</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-[#C8933E]" />
                )}
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-[#C8933E] text-[#17203A]">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-slate-400">User</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-left text-sm text-slate-300 hover:text-[#E27D6B] transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-[#17203A]">{activeLabel}</h2>

          {/* Mobile avatar + logout */}
          <div className="md:hidden flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-[#C8933E] text-[#17203A]">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <button onClick={logout} aria-label="Keluar" className="text-slate-400 hover:text-[#E27D6B] transition-colors">
              <LogOut className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#17203A] border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-[#C8933E]' : 'text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}