import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => {
          navigator.vibrate?.(15);
          install();
        }}
        className="shrink-0 min-h-[44px] px-3 py-1.5 rounded-xl bg-[#0866E9] hover:bg-[#0758CC] text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            navigator.vibrate?.(15);
            setShowIOSGuide(true);
          }}
          className="shrink-0 min-h-[44px] px-3 py-1.5 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] hover:border-[#0866E9] dark:hover:border-[#FF7900] text-[#172033] dark:text-white border border-[#E2E8F0] dark:border-[#263954] text-xs font-medium flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div
            onClick={() => setShowIOSGuide(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs p-3"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111D30] p-3.5 shadow-2xl border border-[#E2E8F0] dark:border-[#263954] space-y-2.5 text-[#172033] dark:text-white"
            >
              <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#263954] pb-2">
                <h3 className="text-[13.5px] font-semibold text-[#172033] dark:text-white">
                  Install KasirKita di iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 -mr-2 rounded-xl text-[#64748B] dark:text-[#94A3B8] flex items-center justify-center cursor-pointer"
                  aria-label="Tutup panduan"
                >
                  <X size={15} />
                </button>
              </div>
              <p className="text-[12.5px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-snug">
                1. Ketuk tombol <span className="font-medium text-[#172033] dark:text-white">Bagikan (Share)</span> di bar Safari.<br />
                2. Gulir ke bawah lalu pilih <span className="font-medium text-[#172033] dark:text-white">Tambahkan ke Layar Utama (Add to Home Screen)</span>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#0866E9] hover:bg-[#0758CC] py-2 text-[12.5px] font-semibold text-white cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
