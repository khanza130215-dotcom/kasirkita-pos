import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  MessageCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useLicense } from '../../context/LicenseContext';

const SELLER_WA_NUMBER = '6281113900923';

export const ActivationModal: React.FC = () => {
  const {
    deviceId,
    isActivated,
    activatedKey,
    maxDemoTransactions,
    remainingTransactions,
    isDemoExpired,
    isActivationModalOpen,
    closeActivationModal,
    activateApp,
  } = useLicense();

  const [codeInput, setCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Tampilkan jika masa demo habis (layar kunci wajib) atau dibuka manual oleh pengguna
  const visible = isDemoExpired || isActivationModalOpen;
  if (!visible) return null;

  const isLocked = isDemoExpired && !isActivated;

  const handleCopyDeviceId = async () => {
    try {
      await navigator.clipboard.writeText(deviceId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback jika clipboard API diblokir
      setCopiedId(false);
    }
  };

  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = activateApp(codeInput);
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg(res.message);
    setCodeInput('');
  };

  const waMessage = encodeURIComponent(
    `Halo Developer KasirKita, saya ingin membeli Kode Aktivasi Lisensi. ID Perangkat saya: ${deviceId}`
  );
  const waHref = `https://wa.me/${SELLER_WA_NUMBER}?text=${waMessage}`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none transition-colors duration-200 ${
        isLocked
          ? 'bg-slate-100/95 dark:bg-slate-950 backdrop-blur-md'
          : 'bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs'
      }`}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
        {/* Header Modal / Lock Screen */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                isActivated
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/70'
                  : isLocked
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/70'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-[#0866E9] dark:text-blue-400 border-blue-200 dark:border-blue-800/70'
              }`}
            >
              {isActivated ? (
                <ShieldCheck size={18} />
              ) : isLocked ? (
                <Lock size={18} />
              ) : (
                <KeyRound size={18} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                {isActivated
                  ? 'Lisensi Penuh Aktif'
                  : isLocked
                    ? 'Masa Uji Coba (Demo) Berakhir'
                    : 'Aktivasi Lisensi KasirKita'}
              </h2>
              <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {isActivated
                  ? 'Perangkat ini telah teraktivasi permanen tanpa batas waktu dan transaksi.'
                  : 'Silakan masukkan Kode Aktivasi untuk membuka versi penuh permanen tanpa batas waktu dan transaksi.'}
              </p>
            </div>
          </div>

          {!isLocked && (
            <button
              type="button"
              onClick={closeActivationModal}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              aria-label="Tutup"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5">
          {/* Status Demo bila belum terkunci & belum aktif */}
          {!isActivated && !isLocked && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 px-3 py-2 flex items-center justify-center text-[11px]">
              <span className="text-amber-800 dark:text-amber-300 font-medium tabular-nums">
                Mode Demo • Sisa {remainingTransactions} dari {maxDemoTransactions} Transaksi
              </span>
            </div>
          )}

          {/* Kotak ID Perangkat Anda */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              ID Perangkat Anda
            </span>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <code className="text-sm sm:text-base font-mono font-semibold text-slate-900 dark:text-slate-100 tracking-wider select-all">
                {deviceId}
              </code>
              <button
                type="button"
                onClick={handleCopyDeviceId}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer"
              >
                {copiedId ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Salin ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isActivated ? (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 p-3 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  Versi Penuh Terverifikasi
                </p>
                <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 break-all">
                  Kode Aktif: {activatedKey}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleActivateSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="activation-code-input"
                  className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1"
                >
                  Masukkan Kode Aktivasi
                </label>
                <input
                  id="activation-code-input"
                  type="text"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="ACT-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono font-medium text-slate-900 dark:text-slate-100 tracking-wider uppercase outline-none focus:border-[#0866E9] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              {errorMsg && (
                <p className="text-[11px] font-normal text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 rounded-lg px-2.5 py-1.5">
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 rounded-lg px-2.5 py-1.5">
                  {successMsg}
                </p>
              )}

              <div className="space-y-2 pt-0.5">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0866E9] hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <KeyRound size={14} />
                  <span>Aktifkan Aplikasi</span>
                </button>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                >
                  <MessageCircle size={14} />
                  <span>Hubungi Penjual via WhatsApp</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivationModal;
