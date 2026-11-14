import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  HardDrive,
  Info,
  RefreshCw,
  Smartphone
} from 'lucide-react';

interface StorageEstimateState {
  supported: boolean;
  loading: boolean;
  usageBytes: number;
  remainingBytes: number;
  quotaBytes: number;
}

const formatUsageSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `~${Math.max(1, Math.round(kb))} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `~${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `~${gb.toFixed(2)} GB`;
};

const formatRemainingCapacity = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Tidak terdeteksi';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${Math.max(1, Math.round(mb))} MB`;
};

const GUIDE_STEPS = [
  {
    number: 1,
    title: 'Setup Awal Toko',
    detail:
      'Buka Menu > Pengaturan Toko untuk mengisi Nama Toko, Alamat, dan unggah gambar QRIS Toko.'
  },
  {
    number: 2,
    title: 'Input Data Barang',
    detail:
      'Masuk ke Produk atau Menu > Import Master Barang untuk menambah daftar harga, stok, dan barcode secara massal maupun satuan.'
  },
  {
    number: 3,
    title: 'Buka Shift Kasir',
    detail:
      'Buka menu Shift untuk mencatat modal awal laci kasir sebelum mulai berjualan.'
  },
  {
    number: 4,
    title: 'Transaksi Kasir',
    detail:
      'Pilih menu Kasir, ketuk barang atau pindai barcode, lalu selesaikan pembayaran via Tunai (hitung kembalian otomatis) atau QRIS.'
  },
  {
    number: 5,
    title: 'Tutup Shift & Backup',
    detail:
      'Cek rekap omzet di menu Laporan, tutup shift di akhir hari, dan lakukan Backup Data berkala di Menu > Backup & Restore.'
  }
];

export const GuideInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [storage, setStorage] = useState<StorageEstimateState>({
    supported: typeof navigator !== 'undefined' && Boolean(navigator.storage?.estimate),
    loading: true,
    usageBytes: 0,
    remainingBytes: 0,
    quotaBytes: 0
  });

  const checkStorage = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
      setStorage({
        supported: false,
        loading: false,
        usageBytes: 0,
        remainingBytes: 0,
        quotaBytes: 0
      });
      return;
    }

    setStorage((prev) => ({ ...prev, loading: true }));
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage ?? 0;
      const quota = estimate.quota ?? 0;
      const remaining = Math.max(0, quota - usage);

      setStorage({
        supported: true,
        loading: false,
        usageBytes: usage,
        remainingBytes: remaining,
        quotaBytes: quota
      });
    } catch {
      setStorage({
        supported: false,
        loading: false,
        usageBytes: 0,
        remainingBytes: 0,
        quotaBytes: 0
      });
    }
  }, []);

  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  const usageMb = storage.usageBytes / (1024 * 1024);
  const isLightLoad = usageMb < 20;
  const usagePercent =
    storage.quotaBytes > 0
      ? Math.min(100, Math.max(1, (storage.usageBytes / storage.quotaBytes) * 100))
      : 1;

  return (
    <div className="h-full flex flex-col p-2.5 md:p-4 overflow-hidden select-none bg-slate-50 dark:bg-slate-950 gap-2.5 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pt-0.5 shrink-0 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[#0866E9] dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500/50 active:scale-95 transition-all cursor-pointer"
            title="Kembali ke Menu"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              Panduan & Info Aplikasi
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              Cara pakai & cek kapasitas memori
            </p>
          </div>
        </div>
      </div>

      {/* Konten Utama */}
      <div className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar max-w-4xl mx-auto w-full space-y-2.5 pb-2">
        {/* Bagian A: Narasi Singkat Aplikasi */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs transition-colors">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0866E9] dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                KasirKita POS — Kasir Cepat & Offline-First
              </h2>
              <p className="text-[11px] sm:text-xs font-normal text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                Aplikasi kasir modern yang dirancang ringan untuk HP, Tablet, dan PC. Seluruh data
                produk dan transaksi tersimpan aman langsung di memori perangkat Anda sehingga kasir
                tetap berjalan lancar 100% tanpa koneksi internet dan bebas biaya langganan server.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
          {/* Bagian B: Panduan Langkah Penggunaan */}
          <section className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs transition-colors">
            <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800">
              <BookOpen size={15} className="text-[#0866E9] dark:text-blue-400 shrink-0" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Panduan Penggunaan (5 Langkah Praktis)
              </h3>
            </div>

            <ol className="divide-y divide-slate-100 dark:divide-slate-800">
              {GUIDE_STEPS.map((step) => (
                <li key={step.number} className="py-2 first:pt-0 last:pb-0 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10.5px] font-medium flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                    {step.number}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-tight">
                      {step.title}
                    </p>
                    <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Bagian C: Monitor Beban Memori Perangkat */}
          <section className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs transition-colors space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HardDrive size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Monitor Beban Memori
                </h3>
              </div>
              <button
                type="button"
                onClick={checkStorage}
                disabled={storage.loading}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                title="Perbarui pembacaan kapasitas memori"
              >
                <RefreshCw size={11} className={storage.loading ? 'animate-spin' : ''} />
                <span>Cek Ulang</span>
              </button>
            </div>

            {/* Indikator Real-Time */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 block">
                    Terpakai oleh KasirKita
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5 block">
                    {storage.loading
                      ? 'Menghitung...'
                      : storage.supported
                        ? formatUsageSize(storage.usageBytes)
                        : 'Tidak tersedia'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 block">
                    Sisa Kapasitas Perangkat
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5 block">
                    {storage.loading
                      ? 'Menghitung...'
                      : storage.supported
                        ? formatRemainingCapacity(storage.remainingBytes)
                        : 'Tidak tersedia'}
                  </span>
                </div>
              </div>

              {/* Bar Persentase Memori */}
              {storage.supported && !storage.loading && (
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              )}

              {/* Status Beban */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10.5px] font-normal text-slate-500 dark:text-slate-400">
                  Status Beban:
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-md border ${
                    isLightLoad
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/70'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/70'
                  }`}
                >
                  <CheckCircle2 size={11} />
                  <span>{isLightLoad ? 'Sangat Ringan & Aman' : 'Normal & Terkendali'}</span>
                </span>
              </div>
            </div>

            {/* Penjelasan Ringkas */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-700 dark:text-slate-200">
                <Info size={12} className="text-slate-400 shrink-0" />
                <span>Informasi Kapasitas Penyimpanan</span>
              </div>
              <ul className="space-y-1 text-[10.5px] font-normal text-slate-500 dark:text-slate-400 leading-relaxed list-disc pl-4">
                <li>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    Ukuran Sistem & Offline Cache:
                  </span>{' '}
                  ± 3 – 5 MB.
                </li>
                <li>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    Kapasitas Data:
                  </span>{' '}
                  10.000 transaksi teks hanya memakan ± 3 MB memori.
                </li>
                <li>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    Rekomendasi:
                  </span>{' '}
                  Total penyimpanan rata-rata di bawah 20 MB sehingga tidak membebani RAM maupun
                  baterai HP/Tablet kasir.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GuideInfoPage;
