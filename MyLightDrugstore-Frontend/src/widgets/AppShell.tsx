import { Outlet, NavLink, useNavigate } from '../shared/router-compat';
import { useState, useEffect } from 'react';
import { useSession } from '../shared/SessionContext';
import { mockApi } from '../shared/api/client';
import { formatTime } from '../shared/ui';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

function Icon({ d }: { d: string }) {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Medicines', to: '/catalog/medicines', icon: <Icon d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /> },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Stock Overview', to: '/inventory', icon: <Icon d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /> },
      { label: 'Receive Stock', to: '/inventory/receipts', icon: <Icon d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /> },
      { label: 'Adjustments', to: '/inventory/adjustments', icon: <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
      { label: 'Movements', to: '/inventory/movements', icon: <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'New Sale', to: '/sales/new', icon: <Icon d="M12 4v16m8-8H4" /> },
      { label: 'Open Cart', to: '/sales/cart', icon: <Icon d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> },
      { label: 'Sale History', to: '/sales', icon: <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Inventory Report', to: '/reports/inventory', icon: <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
      { label: 'Sales Report', to: '/reports/sales', icon: <Icon d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Staff Accounts', to: '/admin/users', icon: <Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />, adminOnly: true },
      { label: 'Backups', to: '/backups', icon: <Icon d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />, adminOnly: true },
      { label: 'Change Password', to: '/settings/security', icon: <Icon d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /> },
    ],
  },
];

export default function AppShell({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      try {
        const { utc } = mockApi.getSystemTime();
        setClock(formatTime(utc));
      } catch { /* ignore */ }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-56' : 'w-14'} shrink-0 bg-navy-900 text-navy-100 flex flex-col transition-all duration-200 overflow-hidden`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-navy-700 shrink-0">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a1 1 0 011 1v3h3a1 1 0 010 2h-3v3a1 1 0 01-2 0V8H8a1 1 0 010-2h3V3a1 1 0 011-1zM4 14a8 8 0 1016 0H4z" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight truncate">MyLight</p>
              <p className="text-[10px] text-navy-300 leading-tight">Drugstore</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map(group => {
            const visible = group.items.filter(item => !item.adminOnly || user?.role === 'admin');
            if (visible.length === 0) return null;
            return (
              <div key={group.label}>
                {sidebarOpen && (
                  <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-widest px-2 mb-1">{group.label}</p>
                )}
                <div className="space-y-0.5">
                  {visible.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }: { isActive: boolean }) =>
                        `flex items-center gap-2.5 px-2 py-2 rounded-md text-xs font-medium transition-colors ${isActive
                          ? 'bg-teal-600/20 text-teal-400'
                          : 'text-navy-300 hover:bg-navy-700 hover:text-white'}`
                      }
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      {item.icon}
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-navy-700 p-2 shrink-0">
          {sidebarOpen && user && (
            <div className="px-2 py-1.5 mb-1">
              <p className="text-xs font-medium text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-navy-400 capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-md text-xs font-medium text-navy-400 hover:bg-navy-700 hover:text-white transition-colors"
            title="Logout"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 shrink-0 no-print">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          {clock && (
            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200">
              🕐 {clock} PHT
            </span>
          )}

          {user && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-semibold">
                {user.fullName.charAt(0)}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-slate-700 leading-tight">{user.fullName}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
