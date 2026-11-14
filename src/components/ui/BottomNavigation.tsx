import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  ChartBarIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Bars3Icon as Bars3IconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  label: string;
  path: string;
  matchPaths: string[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Beranda',
    path: '/',
    matchPaths: ['/', '/beranda'],
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    label: 'Kasir',
    path: '/kasir',
    matchPaths: ['/kasir', '/pos'],
    icon: ShoppingCartIcon,
    activeIcon: ShoppingCartIconSolid,
  },
  {
    label: 'Produk',
    path: '/products',
    matchPaths: ['/products'],
    icon: Squares2X2Icon,
    activeIcon: Squares2X2IconSolid,
  },
  {
    label: 'Laporan',
    path: '/laporan',
    matchPaths: ['/laporan', '/reports'],
    icon: ChartBarIcon,
    activeIcon: ChartBarIconSolid,
  },
  {
    label: 'Menu',
    path: '/menu',
    matchPaths: [
      '/menu',
      '/settings',
      '/expenses',
      '/shift',
      '/transactions',
      '/backup',
      '/guide',
      '/about',
    ],
    icon: Bars3Icon,
    activeIcon: Bars3IconSolid,
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isRouteActive = (item: NavItem) => {
    if (item.path === '/') {
      return location.pathname === '/' || location.pathname === '/beranda';
    }
    return item.matchPaths.some((prefix) => location.pathname.startsWith(prefix));
  };

  return (
    <nav
      aria-label="Navigasi Utama"
      className="flex-none w-full bg-white/95 dark:bg-[#111D30]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-[#263954] z-40 pb-[env(safe-area-inset-bottom)] transition-colors duration-200"
    >
      <div className="max-w-3xl mx-auto w-full h-[58px] grid grid-cols-5 items-center gap-1 px-2 sm:px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = isRouteActive(item);
          const IconComponent = isActive ? item.activeIcon : item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigator.vibrate?.(10);
                navigate(item.path);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[44px] h-[46px] flex flex-col items-center justify-center px-1 rounded-xl border transition-all duration-150 cursor-pointer min-w-0 ${
                isActive
                  ? 'text-[#0866E9] dark:text-[#FF7900] bg-[#0866E9]/8 dark:bg-[#FF7900]/12 border-[#0866E9]/25 dark:border-[#FF7900]/40 font-semibold shadow-2xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 border-transparent font-medium'
              }`}
            >
              <IconComponent className="w-[18px] h-[18px] shrink-0" />
              <span className="text-[10.5px] leading-none mt-1 tracking-tight truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
