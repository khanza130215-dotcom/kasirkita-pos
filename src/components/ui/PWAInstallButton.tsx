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
        className="shrink-0 px-2.5 py-1 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white text-[10px] font-medium flex items-center gap-1 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
      >
        <Download className="w-3 h-3" />
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
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-medium flex items-center gap-1 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Smartphone className="w-3 h-3" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div
            onClick={() => setShowIOSGuide(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Install KasirKita di iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs font-normal text-slate-600 dark:text-slate-400 leading-relaxed">
                1. Ketuk tombol <span className="font-medium text-slate-800 dark:text-slate-100">Bagikan (Share)</span> di bar Safari.<br />
                2. Gulir ke bawah lalu pilih <span className="font-medium text-slate-800 dark:text-slate-100">Tambahkan ke Layar Utama (Add to Home Screen)</span>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#2563eb] py-2 text-xs font-medium text-white cursor-pointer"
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
