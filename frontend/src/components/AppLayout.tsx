import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Store, LogOut, Menu, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/auth';

const navItems = [{ href: '/dashboard', label: 'Clientes', icon: Store }];

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    apiClient.clearToken();
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-sidebar flex flex-col z-40 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-6 bg-white">
          <BrandLogo height={44} />
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-700 lg:hidden"
            title="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith('/client/');
            return (
              <Link
                key={href}
                to={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-orange-600 text-white'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-hover p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-orange-600 flex items-center justify-center text-sm font-semibold text-white">
              {getInitials(user?.name || 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-text-active">{user?.name}</p>
              <p className="truncate text-xs text-sidebar-text">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sidebar-text hover:text-sidebar-text-active"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="text-slate-600" title="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
          <BrandLogo height={28} />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
