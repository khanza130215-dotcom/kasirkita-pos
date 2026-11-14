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
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 select-none transition-colors duration-200 ${
        isLocked
          ? 'bg-[#F1F4F8]/95 dark:bg-[#070B16]/95 backdrop-blur-md'
          : 'bg-black/60 backdrop-blur-xs'
      }`}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-2xl shadow-2xl overflow-hidden transition-colors">
        {/* Header Modal / Lock Screen */}
        <div className="px-3.5 pt-3.5 pb-2.5 border-b border-[#E2E8F0] dark:border-[#263954] flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                isActivated
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/70'
                  : isLocked
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/70'
                    : 'bg-blue-50 dark:bg-[#0866E9]/20 text-[#0866E9] dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
              }`}
            >
              {isActivated ? (
                <ShieldCheck size={17} />
              ) : isLocked ? (
                <Lock size={17} />
              ) : (
                <KeyRound size={17} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[#172033] dark:text-white leading-tight">
                {isActivated
                  ? 'Lisensi Penuh Aktif'
                  : isLocked
                    ? 'Masa Uji Coba (Demo) Berakhir'
                    : 'Aktivasi Lisensi KasirKita'}
              </h2>
              <p className="text-[12px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-snug">
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
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              aria-label="Tutup"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-3.5 space-y-2.5">
          {/* Status Demo bila belum terkunci & belum aktif */}
          {!isActivated && !isLocked && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 px-3 py-1.5 flex items-center justify-center text-[11px]">
              <span className="text-amber-800 dark:text-amber-300 font-medium tabular-nums">
                Mode Demo • Sisa {remainingTransactions} dari {maxDemoTransactions} Transaksi
              </span>
            </div>
          )}

          {/* Kotak ID Perangkat Anda */}
          <div className="rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] p-2.5">
            <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] block leading-tight">
              ID Perangkat Anda
            </span>
            <div className="mt-1 flex items-center justify-between gap-2">
              <code className="text-[14px] font-mono font-semibold text-[#172033] dark:text-white tracking-wider select-all">
                {deviceId}
              </code>
              <button
                type="button"
                onClick={handleCopyDeviceId}
                className="min-h-[44px] px-3 py-1.5 rounded-lg bg-white dark:bg-[#111D30] hover:border-[#0866E9] dark:hover:border-[#FF7900] border border-[#E2E8F0] dark:border-[#263954] text-[#172033] dark:text-white text-xs font-medium flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer"
              >
                {copiedId ? (
                  <>
                    <Check size={14} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Salin ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isActivated ? (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 p-2.5 flex items-start gap-2">
              <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-emerald-800 dark:text-emerald-300 leading-tight">
                  Versi Penuh Terverifikasi
                </p>
                <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 break-all">
                  Kode Aktif: {activatedKey}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleActivateSubmit} className="space-y-2.5">
              <div>
                <label
                  htmlFor="activation-code-input"
                  className="text-[11px] font-medium text-[#172033] dark:text-white block mb-1"
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
                  className="w-full h-10 px-3 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] text-[13px] font-mono font-medium text-[#172033] dark:text-white tracking-wider uppercase outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] transition-colors placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8]"
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
                  className="w-full min-h-[44px] py-2 px-4 rounded-xl bg-[#0866E9] hover:bg-[#0758CC] text-white text-[12.5px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <KeyRound size={15} />
                  <span>Aktifkan Aplikasi</span>
                </button>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] py-2 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 text-[12.5px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <MessageCircle size={15} />
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
