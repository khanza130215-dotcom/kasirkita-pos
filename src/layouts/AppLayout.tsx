import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  KeyRound,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { db } from '../db/db';
import { settingsService } from '../services/settingsService';
import { useTheme } from '../context/ThemeContext';
import { useLicense } from '../context/LicenseContext';
import { ActivationModal } from '../components/license/ActivationModal';
import { BottomNavigation } from '../components/ui/BottomNavigation';

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'KK';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const {
    isActivated,
    isDemoExpired,
    maxDemoTransactions,
    remainingTransactions,
    openActivationModal,
  } = useLicense();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Pastikan record settings default tersedia saat awal boot
  useEffect(() => {
    settingsService.getSettings().catch(() => undefined);
  }, []);

  // Ambil pengaturan toko secara live dari IndexedDB (Settings)
  const storeSettings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const lowStockCount =
    useLiveQuery(async () => {
      const products = await db.products.toArray();
      return products.filter(
        (p) => p.status !== 'inactive' && (p.openingStock ?? 0) <= (p.minimumStock ?? 0)
      ).length;
    }, [], 0) ?? 0;
  const activeShift = useLiveQuery(
    () => db.shifts.where('status').equals('open').first(),
    []
  );

  useEffect(() => {
    if (!isNotifOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isNotifOpen]);

  const storeName = storeSettings?.storeName?.trim() || 'KasirKita POS';
  const storeAddress = storeSettings?.address?.trim() || 'Alamat toko belum diatur';
  const storeLogo = storeSettings?.logo?.trim() || '';
  const initials = getInitials(storeName);

  const hasAlerts = !isActivated || lowStockCount > 0;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white select-none transition-colors duration-200">
      {/* Header Global */}
      <header className="flex-none w-full bg-white/95 dark:bg-[#111D30]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#263954] z-30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 h-[52px] flex items-center justify-between gap-2">
          {/* Avatar, Nama Toko & Alamat Toko dari Settings */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="w-8 h-8 rounded-lg object-cover border border-[#E2E8F0] dark:border-[#263954] shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#0866E9] dark:bg-[#FF7900] text-white font-semibold text-xs flex items-center justify-center shadow-2xs shrink-0 transition-colors">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-[13.5px] font-semibold text-[#172033] dark:text-white leading-tight truncate">
                {storeName}
              </h1>
              <p className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-tight truncate mt-0.5">
                {storeAddress}
              </p>
            </div>
          </div>

          {/* Toggle Light/Dark & Ikon Notifikasi (Area sentuh >= 44px) */}
          <div className="flex items-center gap-1.5 shrink-0" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                navigator.vibrate?.(10);
                toggleTheme();
              }}
              aria-label={isDark ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap'}
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] hover:border-[#0866E9] dark:hover:border-[#FF7900] text-[#172033] dark:text-[#FF7900] border border-[#E2E8F0] dark:border-[#263954] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  navigator.vibrate?.(10);
                  setIsNotifOpen((prev) => !prev);
                }}
                aria-label="Notifikasi"
                aria-expanded={isNotifOpen}
                title="Notifikasi Toko"
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] hover:border-[#0866E9] dark:hover:border-[#FF7900] text-[#172033] dark:text-white border border-[#E2E8F0] dark:border-[#263954] flex items-center justify-center active:scale-95 transition-all cursor-pointer relative"
              >
                <Bell size={17} />
                {hasAlerts && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#0866E9] dark:bg-[#FF7900] ring-2 ring-white dark:ring-[#111D30]" />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-[#E2E8F0] dark:border-[#263954] flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#172033] dark:text-white">
                      Notifikasi Sistem
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="min-w-[44px] min-h-[44px] w-11 h-11 -mr-2 -my-1.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] flex items-center justify-center hover:text-[#172033] dark:hover:text-white cursor-pointer"
                      aria-label="Tutup notifikasi"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="divide-y divide-[#E2E8F0] dark:divide-[#263954] text-[12.5px]">
                    {/* Status Shift */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotifOpen(false);
                        navigate('/shift');
                      }}
                      className="w-full min-h-[44px] text-left px-3 py-2 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 flex items-start gap-2 transition-colors cursor-pointer"
                    >
                      <Clock
                        size={15}
                        className={`shrink-0 mt-0.5 ${
                          activeShift
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[#64748B] dark:text-[#94A3B8]'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-[#172033] dark:text-white leading-snug">
                          {activeShift ? 'Shift Kasir Sedang Buka' : 'Shift Kasir Belum Dibuka'}
                        </p>
                        <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-snug">
                          {activeShift
                            ? 'Ketuk untuk lihat rincian shift kasir saat ini.'
                            : 'Ketuk untuk membuka shift kasir sebelum transaksi.'}
                        </p>
                      </div>
                    </button>

                    {/* Status Stok Menipis */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotifOpen(false);
                        navigate('/products');
                      }}
                      className="w-full min-h-[44px] text-left px-3 py-2 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 flex items-start gap-2 transition-colors cursor-pointer"
                    >
                      {lowStockCount > 0 ? (
                        <AlertTriangle
                          size={15}
                          className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
                        />
                      ) : (
                        <CheckCircle2
                          size={15}
                          className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-[#172033] dark:text-white tabular-nums leading-snug">
                          {lowStockCount > 0
                            ? `${lowStockCount} Produk Stok Menipis`
                            : 'Stok Produk Aman'}
                        </p>
                        <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-snug">
                          {lowStockCount > 0
                            ? 'Ketuk untuk cek daftar barang yang perlu restok.'
                            : 'Semua stok barang masih berada di atas batas minimum.'}
                        </p>
                      </div>
                    </button>

                    {/* Status Lisensi */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotifOpen(false);
                        openActivationModal();
                      }}
                      className="w-full min-h-[44px] text-left px-3 py-2 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 flex items-start gap-2 transition-colors cursor-pointer"
                    >
                      <KeyRound
                        size={15}
                        className={`shrink-0 mt-0.5 ${
                          isActivated
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[#0866E9] dark:text-[#FF7900]'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-[#172033] dark:text-white tabular-nums leading-snug">
                          {isActivated
                            ? 'Lisensi Penuh Aktif'
                            : `Mode Demo (Sisa ${remainingTransactions} dari ${maxDemoTransactions} Transaksi)`}
                        </p>
                        <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-snug">
                          {isActivated
                            ? 'Aplikasi teraktivasi permanen di perangkat ini.'
                            : 'Ketuk untuk memasukkan kode aktivasi lisensi.'}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Banner Mode Demo Ringkas */}
      {!isActivated && !isDemoExpired && (
        <button
          type="button"
          onClick={openActivationModal}
          className="flex-none shrink-0 w-full bg-amber-50 dark:bg-[#111D30] hover:bg-amber-100/80 dark:hover:bg-[#192842] border-b border-[#E2E8F0] dark:border-[#263954] py-1 px-3 flex items-center justify-center gap-1.5 text-[11px] leading-tight font-medium text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
        >
          <KeyRound size={11} className="shrink-0 text-amber-600 dark:text-[#FF7900]" />
          <span className="truncate tabular-nums">
            Mode Demo (Sisa {remainingTransactions} dari {maxDemoTransactions} Transaksi) •{' '}
            <span className="underline underline-offset-2 font-semibold text-[#0866E9] dark:text-[#FF7900]">
              Aktivasi Sekarang
            </span>
          </span>
        </button>
      )}

      {/* Area Konten Utama */}
      <main className="flex-1 min-h-0 min-w-0 w-full overflow-hidden flex flex-col">
        <div className="w-full flex-1 min-h-0 max-w-7xl mx-auto flex flex-col overflow-hidden">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation 1 Baris */}
      <BottomNavigation />

      <ActivationModal />
    </div>
  );
};

export default AppLayout;