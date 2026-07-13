import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, LayoutGrid, FileCheck2, LogOut, Users, UsersRound, Layers } from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/tables', label: 'Tabel Penilaian', icon: LayoutGrid },
  { path: '/admin/groups', label: 'Grup', icon: Layers },
  { path: '/admin/teams', label: 'Tim', icon: UsersRound },
  { path: '/admin/users', label: 'Pengguna', icon: Users },
  { path: '/admin/assessments', label: 'Penilaian', icon: FileCheck2 },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  // Aktifkan menu "Tabel Penilaian" juga untuk sub-halaman /admin/tables/...
  const activeItem = navItems.find(i =>
    i.path === '/admin/tables'
      ? location.pathname.startsWith('/admin/tables')
      : location.pathname === i.path
  );
  const activeLabel = activeItem?.label || 'Admin';

  const isActive = (path) =>
    path === '/admin/tables' ? location.pathname.startsWith('/admin/tables') : location.pathname === path;

  return (
    <div className="flex h-screen bg-[#F3F4F7]">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-64 bg-[#17203A] text-white flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Sistem Penilaian</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-[#C8933E]/20 text-[#C8933E] px-1.5 py-0.5 rounded">
              Admin
            </span>
          </div>
          <h1 className="font-serif text-xl font-semibold mt-0.5">Admin Panel</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const active = isActive(item.path);
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
              <p className="text-xs text-slate-400">Admin</p>
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
            const active = isActive(item.path);
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