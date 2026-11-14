import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  HardDrive,
  Info,
  KeyRound,
  RefreshCw,
  Smartphone,
  X
} from 'lucide-react';
import {
  DEVELOPER_MASTER_KEY,
  generateActivationCode,
  normalizeDeviceId
} from '../services/licenseService';
import { useLicense } from '../context/LicenseContext';

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
  const { deviceId } = useLicense();
  const [storage, setStorage] = useState<StorageEstimateState>({
    supported: typeof navigator !== 'undefined' && Boolean(navigator.storage?.estimate),
    loading: true,
    usageBytes: 0,
    remainingBytes: 0,
    quotaBytes: 0
  });

  // Hidden Developer License Generator (7x tap on "KasirKita POS" title)
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<number | null>(null);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [buyerDeviceId, setBuyerDeviceId] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleTitleTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) {
      window.clearTimeout(tapTimerRef.current);
    }
    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;
      setIsDevModalOpen(true);
      return;
    }
    tapTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
    };
  }, []);

  const handleGenerateCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeDeviceId(buyerDeviceId);
    if (!cleaned) return;
    setGeneratedCode(generateActivationCode(cleaned));
    setCopiedCode(false);
  };

  const handleCopyGenerated = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(false);
    }
  };

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
    <div className="h-full flex flex-col p-3 overflow-hidden select-none bg-[#F1F4F8] dark:bg-[#070B16] gap-2.5 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] flex items-center justify-center text-[#172033] dark:text-white hover:border-[#0866E9] dark:hover:border-[#FF7900] active:scale-95 transition-all cursor-pointer"
            title="Kembali ke Menu"
          >
            <ArrowLeft size={17} strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">
              Panduan & Info Aplikasi
            </h1>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 leading-tight">
              Cara pakai & cek kapasitas memori
            </p>
          </div>
        </div>
      </div>

      {/* Konten Utama */}
      <div className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar max-w-4xl mx-auto w-full space-y-2.5 pb-4">
        {/* Bagian A: Narasi Singkat Aplikasi */}
        <section className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 transition-colors">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#0866E9]/20 text-[#0866E9] dark:text-blue-400 border border-blue-200/70 dark:border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone size={16} />
            </div>
            <div className="min-w-0">
              <h2
                onClick={handleTitleTap}
                className="text-[13.5px] font-semibold text-[#172033] dark:text-white leading-tight cursor-default"
              >
                KasirKita POS — Kasir Cepat & Offline-First
              </h2>
              <p className="text-[12px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-snug mt-1">
                Aplikasi kasir modern yang dirancang ringan untuk HP, Tablet, dan PC. Seluruh data
                produk dan transaksi tersimpan aman langsung di memori perangkat Anda sehingga kasir
                tetap berjalan lancar 100% tanpa koneksi internet dan bebas biaya langganan server.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
          {/* Bagian B: Panduan Langkah Penggunaan */}
          <section className="md:col-span-7 bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 transition-colors">
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-[#E2E8F0] dark:border-[#263954]">
              <BookOpen size={15} className="text-[#0866E9] dark:text-[#FF7900] shrink-0" />
              <h3 className="text-[13.5px] font-semibold text-[#172033] dark:text-white leading-tight">
                Panduan Penggunaan (5 Langkah Praktis)
              </h3>
            </div>

            <ol className="divide-y divide-[#E2E8F0] dark:divide-[#263954]">
              {GUIDE_STEPS.map((step) => (
                <li key={step.number} className="py-2 first:pt-0 last:pb-0 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white border border-[#E2E8F0] dark:border-[#263954] text-[11px] font-medium flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                    {step.number}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight">
                      {step.title}
                    </p>
                    <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-snug mt-0.5">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Bagian C: Monitor Beban Memori Perangkat */}
          <section className="md:col-span-5 bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 transition-colors space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#263954]">
              <div className="flex items-center gap-1.5">
                <HardDrive size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h3 className="text-[13.5px] font-semibold text-[#172033] dark:text-white leading-tight">
                  Monitor Beban Memori
                </h3>
              </div>
              <button
                type="button"
                onClick={checkStorage}
                disabled={storage.loading}
                className="min-h-[44px] px-2.5 py-1.5 rounded-lg bg-[#F1F4F8] dark:bg-[#070B16] hover:border-[#0866E9] dark:hover:border-[#FF7900] text-[#172033] dark:text-white text-xs font-medium flex items-center gap-1.5 border border-[#E2E8F0] dark:border-[#263954] active:scale-95 transition-all cursor-pointer disabled:opacity-45"
                title="Perbarui pembacaan kapasitas memori"
              >
                <RefreshCw size={13} className={storage.loading ? 'animate-spin' : ''} />
                <span>Cek Ulang</span>
              </button>
            </div>

            {/* Indikator Real-Time */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954]">
                  <span className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] block leading-tight">
                    Terpakai oleh KasirKita
                  </span>
                  <span className="text-[14px] font-semibold text-[#172033] dark:text-white tabular-nums mt-0.5 block leading-tight">
                    {storage.loading
                      ? 'Menghitung...'
                      : storage.supported
                        ? formatUsageSize(storage.usageBytes)
                        : 'Tidak tersedia'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954]">
                  <span className="text-[10.5px] font-normal text-[#64748B] dark:text-[#94A3B8] block leading-tight">
                    Sisa Kapasitas Perangkat
                  </span>
                  <span className="text-[14px] font-semibold text-[#172033] dark:text-white tabular-nums mt-0.5 block leading-tight">
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
                <div className="w-full h-1.5 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              )}

              {/* Status Beban */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8]">
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
            <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#263954] space-y-1">
              <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#172033] dark:text-white">
                <Info size={12} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                <span>Informasi Kapasitas Penyimpanan</span>
              </div>
              <ul className="space-y-0.5 text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-snug list-disc pl-4">
                <li>
                  <span className="text-[#172033] dark:text-white font-medium">
                    Ukuran Sistem & Offline Cache:
                  </span>{' '}
                  ± 3 – 5 MB.
                </li>
                <li>
                  <span className="text-[#172033] dark:text-white font-medium">
                    Kapasitas Data:
                  </span>{' '}
                  10.000 transaksi teks hanya memakan ± 3 MB memori.
                </li>
                <li>
                  <span className="text-[#172033] dark:text-white font-medium">
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

      {/* Hidden Admin Tool: Developer License Generator */}
      {isDevModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-[#E2E8F0] dark:border-[#263954] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#0866E9]/20 text-[#0866E9] dark:text-blue-400 border border-blue-200/70 dark:border-blue-500/30 flex items-center justify-center">
                  <KeyRound size={15} />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#172033] dark:text-white leading-tight">
                    Developer License Generator
                  </h3>
                  <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8]">
                    Generator kode aktivasi Device-Bound
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDevModalOpen(false)}
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleGenerateCode} className="p-3.5 space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="buyer-device-id"
                    className="text-[11px] font-medium text-[#172033] dark:text-white"
                  >
                    ID Perangkat Pembeli
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerDeviceId(deviceId);
                      setGeneratedCode(generateActivationCode(deviceId));
                      setCopiedCode(false);
                    }}
                    className="min-h-[44px] px-2 text-[11px] font-medium text-[#0866E9] dark:text-[#FF7900] hover:underline cursor-pointer"
                  >
                    Pakai ID Perangkat Ini
                  </button>
                </div>
                <input
                  id="buyer-device-id"
                  type="text"
                  value={buyerDeviceId}
                  onChange={(e) => {
                    setBuyerDeviceId(e.target.value.toUpperCase());
                    if (generatedCode) setGeneratedCode('');
                  }}
                  placeholder="KSK-XXXX-XXXX"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full h-10 px-3 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] text-[13px] font-mono font-medium text-[#172033] dark:text-white tracking-wider uppercase outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] py-2 px-4 rounded-xl bg-[#0866E9] hover:bg-[#0758CC] text-white text-[12.5px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
              >
                <KeyRound size={15} />
                <span>Hasilkan Kode Aktivasi</span>
              </button>

              {generatedCode && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 p-2.5">
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 block">
                    Kode Aktivasi Siap Kirim
                  </span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <code className="text-[14px] font-mono font-semibold text-emerald-900 dark:text-emerald-200 tracking-wider select-all">
                      {generatedCode}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyGenerated}
                      className="min-h-[44px] px-3 py-1.5 rounded-lg bg-white dark:bg-[#111D30] border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check size={14} />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] pt-2 border-t border-[#E2E8F0] dark:border-[#263954]">
                Master Key Pengujian Developer:{' '}
                <code className="font-mono text-[#172033] dark:text-white select-all">
                  {DEVELOPER_MASTER_KEY}
                </code>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideInfoPage;
