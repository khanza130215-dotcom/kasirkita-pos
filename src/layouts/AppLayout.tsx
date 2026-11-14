import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  ChartBarIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'BERANDA', path: '/', icon: HomeIcon },
    { label: 'KASIR', path: '/kasir', icon: ShoppingCartIcon },
    { label: 'PRODUK', path: '/products', icon: Squares2X2Icon },
    { label: 'LAPORAN', path: '/laporan', icon: ChartBarIcon },
    { label: 'MENU', path: '/menu', icon: Bars3Icon },
  ];

  const isRouteActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 select-none transition-colors duration-200">
      {/* Area Konten Utama */}
      <main className="order-1 md:order-2 flex-1 min-h-0 min-w-0 w-full overflow-hidden flex flex-col">
        <div className="w-full h-full max-w-7xl mx-auto flex flex-col min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </main>

      {/* Navigasi Adaptif: Bottom Bar di Mobile (< md), Left Navigation Rail (w-20) di Tablet & PC (md: ke atas) */}
      <nav className="order-2 md:order-1 flex-none w-full md:w-20 md:h-full bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 px-2 py-1.5 md:px-1.5 md:py-4 z-40 flex flex-col justify-center md:justify-start md:items-center md:gap-4 transition-colors duration-200">
        {/* Brand Badge khusus Tablet & PC */}
        <div className="hidden md:flex flex-col items-center gap-1 pb-2 border-b border-slate-100 dark:border-slate-800 w-full">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0866E9] to-blue-500 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
            POS
          </div>
          <span className="text-[8px] font-medium text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            JacS v4
          </span>
        </div>

        <div className="max-w-3xl mx-auto w-full grid grid-cols-5 gap-1 md:max-w-none md:mx-0 md:flex md:flex-col md:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-1 md:py-2.5 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border border-blue-500/80 dark:border-blue-500/70 ring-2 ring-blue-500/20 dark:ring-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.35)] bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'border border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 mb-0.5 md:mb-1" />
                <span className="text-[9px] md:text-[9.5px] tracking-tight truncate w-full text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;