import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart3,
  ChevronRight,
  ClipboardList,
  Clock,
  LayoutGrid,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { db } from '../db/db';
import { Transaction } from '../types';

const formatCurrency = (amount: number): string => {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
};

const formatTxNumber = (id: string): string => {
  if (!id) return 'TRX-0000';
  return id.startsWith('TRX-') ? id : `TRX-${id.slice(0, 8).toUpperCase()}`;
};

const formatTxTime = (createdAt: Date | string): string => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '-';
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const timeStr = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (isToday) return `Hari ini · ${timeStr}`;
  const dateStr = date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  });
  return `${dateStr} · ${timeStr}`;
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Live query dari database lokal IndexedDB (Dexie v3)
  const transactions = useLiveQuery(() => db.transactions.toArray(), [], []) ?? [];
  const productCount = useLiveQuery(() => db.products.count(), [], 0) ?? 0;
  const activeShift = useLiveQuery(
    () => db.shifts.where('status').equals('OPEN').first(),
    [],
    undefined
  );

  // Kalkulasi penjualan aktual hari ini & pembanding kemarin tanpa penghitungan ganda
  const salesStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0).getTime();
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime();

    // Deduplikasi transaksi berdasarkan ID unik
    const uniqueCompletedMap = new Map<string, Transaction>();
    for (const tx of transactions) {
      if (tx.status === 'COMPLETED' && tx.id && !uniqueCompletedMap.has(tx.id)) {
        uniqueCompletedMap.set(tx.id, tx);
      }
    }

    let todaySales = 0;
    let todayCount = 0;
    let yesterdaySales = 0;
    let yesterdayCount = 0;

    for (const tx of uniqueCompletedMap.values()) {
      const ts = new Date(tx.createdAt).getTime();
      if (!Number.isFinite(ts)) continue;
      const amount = Number(tx.finalAmount) || 0;

      if (ts >= todayStart && ts <= todayEnd) {
        todaySales += amount;
        todayCount += 1;
      } else if (ts >= yesterdayStart && ts <= yesterdayEnd) {
        yesterdaySales += amount;
        yesterdayCount += 1;
      }
    }

    // Indikator perubahan hanya dihitung jika data pembanding kemarin tersedia (> 0)
    const hasComparison = yesterdayCount > 0 && yesterdaySales > 0;
    const changePercent = hasComparison
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
      : null;

    const recentTransactions = Array.from(uniqueCompletedMap.values())
      .sort((a, b) => {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
      })
      .slice(0, 3);

    return {
      todaySales,
      todayCount,
      hasComparison,
      changePercent,
      recentTransactions,
    };
  }, [transactions]);

  const shortcutItems = [
    {
      label: 'Kasir',
      path: '/kasir',
      icon: ShoppingCart,
      iconClass: 'bg-blue-50 dark:bg-[#0866E9]/15 text-[#0866E9] dark:text-blue-400',
    },
    {
      label: 'All Products',
      path: '/products',
      icon: Package,
      iconClass: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Laporan',
      path: '/laporan',
      icon: BarChart3,
      iconClass: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Master Barang',
      path: '/products',
      icon: ClipboardList,
      iconClass: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Pengaturan',
      path: '/settings',
      icon: Settings,
      iconClass: 'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300',
    },
    {
      label: 'Lainnya',
      path: '/menu',
      icon: LayoutGrid,
      iconClass: 'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400',
    },
  ];

  const isPositiveChange = (salesStats.changePercent ?? 0) >= 0;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white px-3 py-2 sm:px-4 sm:py-3 select-none transition-colors duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-2 sm:gap-3">
        {/* A. Kartu Penjualan Hari Ini */}
        <section
          aria-label="Penjualan Hari Ini"
          className="rounded-xl bg-gradient-to-br from-[#0866E9] to-[#024BB5] p-3 sm:p-3.5 text-white shadow-sm border border-[#0866E9]/20"
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-100 leading-tight">
                Penjualan Hari Ini
              </p>
              <h2 className="text-[21px] sm:text-[22px] font-bold tracking-tight text-white tabular-nums leading-tight mt-1">
                {formatCurrency(salesStats.todaySales)}
              </h2>
            </div>

            <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              {salesStats.hasComparison && !isPositiveChange ? (
                <TrendingDown size={18} className="text-white" />
              ) : (
                <TrendingUp size={18} className="text-white" />
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-blue-100 leading-tight">
            <span className="tabular-nums font-normal">
              {salesStats.todayCount > 0
                ? `${salesStats.todayCount} transaksi selesai hari ini`
                : 'Belum ada transaksi hari ini'}
            </span>

            {salesStats.hasComparison && salesStats.changePercent !== null && (
              <span className="inline-flex items-center gap-1 bg-white/15 border border-white/20 px-2 py-0.5 rounded-md text-[10.5px] font-medium text-white tabular-nums">
                {isPositiveChange ? '+' : ''}
                {salesStats.changePercent}% dibanding kemarin
              </span>
            )}
          </div>
        </section>

        {/* Tombol Kapsul Oranye: + Tambah Transaksi Kasir */}
        <button
          type="button"
          onClick={() => {
            navigator.vibrate?.(10);
            navigate('/kasir');
          }}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-gradient-to-r from-[#FF7900] to-[#F06800] hover:from-[#EE7000] hover:to-[#DF5F00] text-white font-semibold text-[13px] tracking-tight shadow-sm border border-[#FF7900]/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <ShoppingCart size={16} strokeWidth={2.25} className="shrink-0" />
          <span>+ Tambah Transaksi Kasir</span>
        </button>

        {/* B. Tiga Ringkasan Sederhana */}
        <section aria-label="Ringkasan Toko" className="grid grid-cols-3 gap-2">
          {/* 1. Jumlah Transaksi */}
          <button
            type="button"
            onClick={() => navigate('/laporan')}
            className="min-h-[44px] bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] rounded-xl p-2.5 text-left flex flex-col justify-between gap-1.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer min-w-0"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#0866E9]/15 text-[#0866E9] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Receipt size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-[#172033] dark:text-white leading-tight tabular-nums truncate">
                {salesStats.todayCount}
              </p>
              <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                Transaksi
              </p>
            </div>
          </button>

          {/* 2. Jumlah Produk */}
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="min-h-[44px] bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] rounded-xl p-2.5 text-left flex flex-col justify-between gap-1.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer min-w-0"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Package size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-[#172033] dark:text-white leading-tight tabular-nums truncate">
                {productCount}
              </p>
              <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                Produk
              </p>
            </div>
          </button>

          {/* 3. Status Kasir / Shift Aktif */}
          <button
            type="button"
            onClick={() => navigate('/shift')}
            className="min-h-[44px] bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] rounded-xl p-2.5 text-left flex flex-col justify-between gap-1.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer min-w-0"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                activeShift
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-[#F1F4F8] dark:bg-[#070B16] text-[#64748B] dark:text-[#94A3B8]'
              }`}
            >
              {activeShift ? <UserCheck size={14} /> : <Clock size={14} />}
            </div>
            <div className="min-w-0">
              <p
                className={`text-base font-semibold leading-tight truncate ${
                  activeShift
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-[#172033] dark:text-white'
                }`}
              >
                {activeShift ? 'Aktif' : 'Tutup'}
              </p>
              <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                {activeShift ? `Shift · ${activeShift.cashierName}` : 'Status Shift'}
              </p>
            </div>
          </button>
        </section>

        {/* C. Menu Pintasan (Grid 3x2) */}
        <section aria-label="Menu Pintasan" className="space-y-2">
          <h3 className="text-[13.5px] font-semibold text-[#172033] dark:text-white tracking-tight px-0.5 leading-tight">
            Menu Pintasan
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {shortcutItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    navigator.vibrate?.(10);
                    navigate(item.path);
                  }}
                  className="min-h-[68px] bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] rounded-xl py-2.5 px-2 flex flex-col items-center justify-center gap-1.5 shadow-2xs active:scale-[0.97] transition-all cursor-pointer min-w-0"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconClass}`}
                  >
                    <IconComponent size={16} />
                  </div>
                  <span className="text-xs font-medium text-[#172033] dark:text-white leading-tight text-center truncate w-full">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* D. Aktivitas Transaksi Terakhir */}
        <section aria-label="Aktivitas Transaksi Terakhir" className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-[13.5px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">
              Aktivitas Transaksi Terakhir
            </h3>
            <button
              type="button"
              onClick={() => {
                navigator.vibrate?.(10);
                navigate('/transactions');
              }}
              className="min-h-[44px] -my-2.5 px-1.5 -mr-1.5 inline-flex items-center gap-0.5 text-[12px] font-medium text-[#0866E9] dark:text-[#FF7900] hover:underline active:opacity-80 transition-opacity cursor-pointer shrink-0"
            >
              <span>Lihat Riwayat</span>
              <ChevronRight size={14} strokeWidth={2.25} />
            </button>
          </div>

          <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl shadow-2xs divide-y divide-[#E2E8F0] dark:divide-[#263954] overflow-hidden">
            {salesStats.recentTransactions.length === 0 ? (
              <div className="py-5 px-3 flex flex-col items-center justify-center text-center gap-1">
                <div className="w-8 h-8 rounded-lg bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] flex items-center justify-center text-[#64748B] dark:text-[#94A3B8]">
                  <Receipt size={15} />
                </div>
                <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight mt-0.5">
                  Belum ada transaksi selesai
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal leading-tight">
                  Transaksi yang dibayar di Kasir akan muncul di sini
                </p>
              </div>
            ) : (
              salesStats.recentTransactions.map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => {
                    navigator.vibrate?.(10);
                    navigate('/transactions');
                  }}
                  className="w-full min-h-[44px] px-3 py-2 flex items-center justify-between gap-2.5 text-left hover:bg-[#F1F4F8]/60 dark:hover:bg-[#192842]/50 active:bg-[#F1F4F8] dark:active:bg-[#192842] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#0866E9]/15 text-[#0866E9] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Receipt size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight truncate">
                        {formatTxNumber(tx.id)}
                      </p>
                      <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-tight mt-0.5 truncate tabular-nums">
                        {formatTxTime(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[12.5px] font-semibold text-[#172033] dark:text-white tabular-nums whitespace-nowrap shrink-0">
                    {formatCurrency(Number(tx.finalAmount) || 0)}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;