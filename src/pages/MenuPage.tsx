import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ChevronRight,
  UserCircle,
  Database,
  Info,
  RefreshCw,
  CheckCircle2,
  Store,
  Clock,
  FileSpreadsheet,
  Moon,
  Sun,
  BookOpen,
  KeyRound,
  MessageCircle
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { shiftService } from '../services/shiftService';
import { expenseService } from '../services/expenseService';
import { Shift, StoreSettings } from '../types';
import { ImportMasterModal } from '../components/products/ImportMasterModal';
import { PWAInstallButton } from '../components/ui/PWAInstallButton';
import { useTheme } from '../context/ThemeContext';
import { useLicense } from '../context/LicenseContext';

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'TF';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const getShiftPeriodLabel = (openedAt: Date): string => {
  const hour = new Date(openedAt).getHours();
  if (hour < 12) return 'Shift Pagi';
  if (hour < 17) return 'Shift Siang';
  return 'Shift Malam';
};

export const MenuPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const {
    deviceId,
    isActivated,
    maxDemoTransactions,
    remainingTransactions,
    openActivationModal,
  } = useLicense();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [todayExpenseTotal, setTodayExpenseTotal] = useState<number>(0);
  const [todayExpenseCount, setTodayExpenseCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Baru saja');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  useEffect(() => {
    let isMounted = true;
    const loadMenuData = async () => {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const [storeData, shiftData, expensesData] = await Promise.all([
          settingsService.getSettings(),
          shiftService.getActiveShift(),
          expenseService.getExpenseHistory(startOfDay, endOfDay)
        ]);

        if (isMounted) {
          setSettings(storeData);
          setActiveShift(shiftData ?? null);
          const total = expensesData.reduce((sum, item) => sum + (item.amount || 0), 0);
          setTodayExpenseTotal(total);
          setTodayExpenseCount(expensesData.length);
        }
      } catch (err) {
        console.error('Gagal memuat data halaman menu:', err);
      }
    };
    loadMenuData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSync = () => {
    navigator.vibrate?.(15);
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync(
        'Hari ini, ' +
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
          ' WIB'
      );
    }, 900);
  };

  const handleToggleDarkMode = () => {
    navigator.vibrate?.(15);
    toggleTheme();
  };

  const storeName = settings?.storeName?.trim() || 'TOKO FARDAN';
  const storeAddress = settings?.address?.trim() || 'Alamat toko belum diatur';
  const storeLogo = settings?.logo?.trim() || '';
  const initials = getInitials(storeName);

  const shiftBadgeText = activeShift
    ? `${getShiftPeriodLabel(activeShift.openedAt)} • Buka`
    : 'Shift • Tutup';
  const shiftTimeText = activeShift
    ? `Mulai ${new Date(activeShift.openedAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })} WIB`
    : 'Ketuk untuk buka kas';

  const developerWaHref = `https://wa.me/6281113900923?text=${encodeURIComponent(
    `Halo Developer KasirKita, saya ingin konsultasi / membeli Kode Aktivasi Lisensi. ID Perangkat saya: ${deviceId}`
  )}`;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden px-3 py-2 bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white select-none relative transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#172033] dark:bg-[#111D30] text-white text-xs font-normal px-3.5 py-2 rounded-xl shadow-xl border border-[#263954] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full flex-1 min-h-0 flex flex-col gap-2">
        {/* Judul Halaman */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <h1 className="text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">
            Menu & Pengaturan
          </h1>
          <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
            KasirKita v4.0
          </span>
        </div>

        {/* 1. Header Toko Ringkas & Dinamis + Sync Terintegrasi */}
        <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-2 shadow-2xs flex flex-col gap-1.5 shrink-0 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="w-8 h-8 rounded-lg object-cover border border-[#E2E8F0] dark:border-[#263954] shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#0866E9] dark:bg-[#FF7900] text-white font-semibold text-xs flex items-center justify-center shadow-2xs shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[13.5px] font-semibold text-[#172033] dark:text-white leading-tight truncate">
                  {storeName}
                </h2>
                <span className="shrink-0 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/70 leading-tight">
                  Kasir Aktif
                </span>
              </div>
              <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                {storeAddress}
              </p>
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] dark:border-[#263954] pt-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] truncate">
                Sync: <span className="text-[#172033] dark:text-white font-medium">{lastSync}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <PWAInstallButton />
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="shrink-0 min-h-[44px] px-2.5 py-1.5 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] hover:border-[#0866E9] dark:hover:border-[#FF7900] text-[#0866E9] dark:text-[#FF7900] text-xs font-medium flex items-center gap-1.5 border border-[#E2E8F0] dark:border-[#263954] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Menyinkron...' : 'Sync Sekarang'}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Operasional Toko — Grid 2 Kolom Informatif */}
        <div className="shrink-0">
          <h3 className="text-[13.5px] font-semibold text-[#172033] dark:text-white px-0.5 mb-1 leading-tight">
            Operasional Toko
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/shift"
              onClick={() => navigator.vibrate?.(15)}
              className="min-h-[44px] bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] active:scale-[0.98] transition-all shadow-2xs rounded-xl p-2 flex flex-col justify-between gap-1 min-w-0"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800/70 shrink-0">
                  <UserCircle size={14} />
                </div>
                <span
                  className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded-md border truncate leading-tight ${
                    activeShift
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/70'
                      : 'bg-[#F1F4F8] dark:bg-[#070B16] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#263954]'
                  }`}
                >
                  {shiftBadgeText}
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#172033] dark:text-white leading-tight truncate">
                  Shift Kasir
                </p>
                <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                  Buka / Tutup Kas
                </p>
              </div>

              <div className="pt-1 border-t border-[#E2E8F0] dark:border-[#263954] flex items-center justify-between gap-1 text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-tight">
                <span className="flex items-center gap-1 truncate">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span className="truncate">{shiftTimeText}</span>
                </span>
                <ChevronRight size={13} className="shrink-0" />
              </div>
            </Link>

            <Link
              to="/expenses"
              onClick={() => navigator.vibrate?.(15)}
              className="min-h-[44px] bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] active:scale-[0.98] transition-all shadow-2xs rounded-xl p-2 flex flex-col justify-between gap-1 min-w-0"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-200/70 dark:border-rose-800/70 shrink-0">
                  <ShieldAlert size={14} />
                </div>
                <span
                  className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded-md border truncate leading-tight ${
                    todayExpenseCount > 0
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/70'
                      : 'bg-[#F1F4F8] dark:bg-[#070B16] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#263954]'
                  }`}
                >
                  {todayExpenseCount} Catatan
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#172033] dark:text-white leading-tight truncate">
                  Pengeluaran Kas
                </p>
                <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                  Catat Biaya
                </p>
              </div>

              <div className="pt-1 border-t border-[#E2E8F0] dark:border-[#263954] flex items-center justify-between gap-1 text-[11px] font-medium text-[#172033] dark:text-white leading-tight">
                <span className="truncate tabular-nums">
                  Hari ini: Rp {todayExpenseTotal.toLocaleString('id-ID')}
                </span>
                <ChevronRight size={13} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
              </div>
            </Link>
          </div>
        </div>

        {/* 3. Sistem & Pengaturan (Scroll Internal bila tinggi layar terbatas) */}
        <div className="flex-1 min-h-0 flex flex-col">
          <h3 className="text-[13.5px] font-semibold text-[#172033] dark:text-white px-0.5 mb-1 leading-tight shrink-0">
            Sistem & Pengaturan
          </h3>
          <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-[#111D30] divide-y divide-[#E2E8F0] dark:divide-[#263954] border border-[#E2E8F0] dark:border-[#263954] transition-all shadow-2xs rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Baris Pengalih Dark Mode */}
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={handleToggleDarkMode}
              className="w-full min-h-[44px] text-left py-1.5 px-3 flex items-center justify-between gap-2.5 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                    isDark
                      ? 'bg-[#FF7900]/15 text-[#FF7900] border-[#FF7900]/40'
                      : 'bg-amber-50 text-amber-600 border-amber-200/70'
                  }`}
                >
                  {isDark ? <Moon size={15} /> : <Sun size={15} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight truncate">
                    Tampilan Gelap (Dark Mode)
                  </p>
                  <p className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                    {isDark ? 'Mode gelap aktif · Nyaman di layar minim cahaya' : 'Mode terang aktif · Ketuk untuk ubah ke gelap'}
                  </p>
                </div>
              </div>

              <span
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 ${
                  isDark
                    ? 'bg-[#FF7900] border-[#FF7900]'
                    : 'bg-[#E2E8F0] border-[#CBD5E1]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                    isDark ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.vibrate?.(15);
                openActivationModal();
              }}
              className="w-full min-h-[44px] text-left py-1.5 px-3 flex items-center justify-between gap-2.5 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                    isActivated
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-[#FF7900] border-amber-200/70 dark:border-amber-800/70'
                  }`}
                >
                  <KeyRound size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight truncate">
                    Status Lisensi & Aktivasi
                  </p>
                  <p className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate tabular-nums leading-tight">
                    {isActivated
                      ? 'Aktif Permanen · Versi Penuh'
                      : `Mode Demo · Sisa ${remainingTransactions} dari ${maxDemoTransactions} Transaksi`}
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
            </button>

            <a
              href={developerWaHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => navigator.vibrate?.(15)}
              className="min-h-[44px] py-1.5 px-3 flex items-center justify-between gap-2.5 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-center shrink-0">
                  <MessageCircle size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight truncate">
                    Hubungi Developer (WhatsApp)
                  </p>
                  <p className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                    0811-1390-0923 · Bantuan & Lisensi
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
            </a>

            <Link
              to="/guide"
              onClick={() => navigator.vibrate?.(15)}
              className="min-h-[44px] py-1.5 px-3 flex items-center justify-between gap-2.5 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/70 dark:border-sky-800/70 flex items-center justify-center shrink-0">
                  <BookOpen size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight truncate">
                    Panduan & Info Aplikasi
                  </p>
                  <p className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                    Cara pakai & cek kapasitas memori
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
            </Link>

            <Link
              to="/settings"
              onClick={() => navigator.vibrate?.(15)}
              className="min-h-[44px] py-1.5 px-3 flex items-center justify-between gap-2.5 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white border border-[#E2E8F0] dark:border-[#263954] flex items-center justify-center shrink-0">
                  <Store size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight truncate">
                    Pengaturan Toko
                  </p>
                  <p className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                    Atur nama toko, alamat & struk
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
            </Link>

            <button
              type="button"
              onClick={() => {
                navigator.vibrate?.(15);
                setIsImportOpen(true);
              }}
              className="w-full min-h-[44px] text-left py-1.5 px-3 flex items-center justify-between gap-2.5 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight truncate">
                    Import Master Barang
                  </p>
                  <p className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                    Unggah CSV atau tempel dari Excel
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
            </button>

            <Link
              to="/backup"
              onClick={() => navigator.vibrate?.(15)}
              className="min-h-[44px] py-1.5 px-3 flex items-center justify-between gap-2.5 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/70 flex items-center justify-center shrink-0">
                  <Database size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight truncate">
                    Backup & Restore Data
                  </p>
                  <p className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                    Cadangkan file database JSON
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
            </Link>

            <Link
              to="/about"
              onClick={() => navigator.vibrate?.(15)}
              className="min-h-[44px] py-1.5 px-3 flex items-center justify-between gap-2.5 hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#0866E9]/15 text-[#0866E9] dark:text-blue-400 border border-blue-200/60 dark:border-[#0866E9]/40 flex items-center justify-center shrink-0">
                  <Info size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight truncate">
                    Tentang Aplikasi
                  </p>
                  <p className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate leading-tight">
                    JacS Enterprise System
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Import Master Barang */}
      <ImportMasterModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={(count) =>
          showToast(`${count} barang berhasil disinkronkan ke halaman Produk & Kasir`)
        }
      />
    </div>
  );
};

export default MenuPage;