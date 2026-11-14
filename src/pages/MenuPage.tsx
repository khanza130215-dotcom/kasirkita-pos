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
  BookOpen
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { shiftService } from '../services/shiftService';
import { expenseService } from '../services/expenseService';
import { Shift, StoreSettings } from '../types';
import { ImportMasterModal } from '../components/products/ImportMasterModal';
import { PWAInstallButton } from '../components/ui/PWAInstallButton';
import { useTheme } from '../context/ThemeContext';

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

  return (
    <div className="h-full w-full flex flex-col justify-start overflow-hidden px-3 py-1.5 md:py-2 gap-1.5 md:gap-2.5 bg-slate-50 dark:bg-slate-950 select-none relative transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-normal px-4 py-2 rounded-xl shadow-xl border border-slate-700/50 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Toko Ringkas & Dinamis + Sync Terintegrasi */}
      <div className="flex-none bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 active:scale-[0.98] transition-all shadow-xs rounded-2xl p-2 md:p-2.5 flex flex-col gap-1.5 md:gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {storeLogo ? (
            <img
              src={storeLogo}
              alt={storeName}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0866E9] to-blue-500 text-white font-medium text-xs flex items-center justify-center shadow-xs shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight truncate">
                {storeName}
              </h2>
              <span className="shrink-0 text-[9px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/70">
                Kasir Aktif
              </span>
            </div>
            <p className="text-[10.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {storeAddress} • POS v4.0
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200/80 dark:border-slate-800 pt-1.5 md:pt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 truncate">
              Sync: <span className="text-slate-800 dark:text-slate-200 font-medium">{lastSync}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0866E9] dark:text-blue-400 text-[10px] font-medium flex items-center gap-1 border border-blue-200 dark:border-blue-800/80 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Menyinkron...' : 'Sync Sekarang'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Operasional Toko — Grid 2 Kolom Informatif */}
      <div className="flex-none">
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 block mb-1">
          Operasional Toko
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            to="/shift"
            onClick={() => navigator.vibrate?.(15)}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 dark:hover:bg-slate-800/80 active:scale-[0.98] transition-all shadow-xs rounded-2xl p-2 md:p-2.5 flex flex-col justify-between gap-1 min-w-0"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800/70 shrink-0">
                <UserCircle size={16} />
              </div>
              <span
                className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md border truncate ${
                  activeShift
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/70'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {shiftBadgeText}
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-tight truncate">
                Shift Kasir
              </p>
              <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Buka/Tutup Kas
              </p>
            </div>

            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-[10px] font-normal text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 truncate">
                <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="truncate">{shiftTimeText}</span>
              </span>
              <ChevronRight size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
            </div>
          </Link>

          <Link
            to="/expenses"
            onClick={() => navigator.vibrate?.(15)}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 dark:hover:bg-slate-800/80 active:scale-[0.98] transition-all shadow-xs rounded-2xl p-2 md:p-2.5 flex flex-col justify-between gap-1 min-w-0"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-200/70 dark:border-rose-800/70 shrink-0">
                <ShieldAlert size={16} />
              </div>
              <span
                className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md border truncate ${
                  todayExpenseCount > 0
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/70'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {todayExpenseCount} Catatan
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-tight truncate">
                Pengeluaran Kas
              </p>
              <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Catat Biaya
              </p>
            </div>

            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-[10px] font-medium text-slate-800 dark:text-slate-200">
              <span className="truncate tabular-nums">
                Hari ini: Rp {todayExpenseTotal.toLocaleString('id-ID')}
              </span>
              <ChevronRight size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Sistem & Pengaturan (Inset Grouped List Ringkas & Tegas) */}
      <div className="flex-none">
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 block mb-1">
          Sistem & Pengaturan
        </span>
        <div className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all shadow-xs rounded-2xl overflow-hidden">
          {/* Baris Pengalih Dark Mode */}
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={handleToggleDarkMode}
            className="w-full text-left py-1.5 md:py-2 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-6 h-6 md:w-7 md:h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                  isDark
                    ? 'bg-indigo-950/70 text-indigo-400 border-indigo-800/70'
                    : 'bg-amber-50 text-amber-600 border-amber-200/70'
                }`}
              >
                {isDark ? <Moon size={13} /> : <Sun size={13} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-tight truncate">
                  Tampilan Gelap (Dark Mode)
                </p>
                <p className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {isDark ? 'Mode gelap aktif • Nyaman di layar minim cahaya' : 'Mode terang aktif • Ketuk untuk ubah ke gelap'}
                </p>
              </div>
            </div>

            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 ${
                isDark
                  ? 'bg-[#2563eb] border-blue-500'
                  : 'bg-slate-200 border-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                  isDark ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>

          <Link
            to="/guide"
            onClick={() => navigator.vibrate?.(15)}
            className="py-1.5 md:py-2 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] active:bg-blue-50/40 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/70 dark:border-sky-800/70 flex items-center justify-center shrink-0">
                <BookOpen size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-tight truncate">
                  Panduan & Info Aplikasi
                </p>
                <p className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Cara pakai & cek kapasitas memori
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
          </Link>

          <Link
            to="/settings"
            onClick={() => navigator.vibrate?.(15)}
            className="py-1.5 md:py-2 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] active:bg-blue-50/40 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center shrink-0">
                <Store size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-tight truncate">
                  Pengaturan Toko
                </p>
                <p className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Atur nama toko, alamat & struk
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={() => {
              navigator.vibrate?.(15);
              setIsImportOpen(true);
            }}
            className="w-full text-left py-1.5 md:py-2 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] active:bg-emerald-50/40 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-normal text-slate-800 dark:text-slate-100 leading-tight truncate">
                  Import Master Barang
                </p>
                <p className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Unggah CSV atau tempel dari Excel
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
          </button>

          <Link
            to="/backup"
            onClick={() => navigator.vibrate?.(15)}
            className="py-1.5 md:py-2 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] active:bg-blue-50/40 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/70 flex items-center justify-center shrink-0">
                <Database size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-tight truncate">
                  Backup & Restore Data
                </p>
                <p className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Cadangkan file database JSON
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
          </Link>

          <Link
            to="/about"
            onClick={() => navigator.vibrate?.(15)}
            className="py-1.5 md:py-2 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] active:bg-blue-50/40 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0866E9] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/70 flex items-center justify-center shrink-0">
                <Info size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-tight truncate">
                  Tentang Aplikasi
                </p>
                <p className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  JacS Enterprise System
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
          </Link>
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