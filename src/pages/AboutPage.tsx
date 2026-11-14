import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Cpu, 
  ShoppingCart, 
  ShieldCheck, 
  Database, 
  Sparkles,
  Layers
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col justify-between p-2.5 overflow-hidden select-none bg-slate-50 dark:bg-slate-950 gap-2 transition-colors duration-200">
      {/* 1. Header dengan Tombol Kembali ke Menu */}
      <div className="flex items-center justify-between pt-0.5 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/menu')}
            className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[#0866E9] dark:hover:text-blue-400 active:scale-95 transition-all cursor-pointer"
            title="Kembali ke Menu"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-none">Tentang Aplikasi</h1>
            <p className="text-[8.5px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Identitas & Arsitektur POS</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5 custom-scrollbar">
        {/* 2. Hero Developer Card JacS Enterprise */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl py-3 px-4 shadow-2xs flex flex-col items-center justify-center text-center shrink-0 transition-colors">
          <img 
            src="/logo-jacs-enterprise_a5443089.png" 
            alt="JacS Enterprise" 
            className="w-12 h-12 object-contain drop-shadow-xs mb-2 select-none"
          />
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-none">JacS Enterprise</h2>
            <ShoppingCart className="w-3.5 h-3.5 text-[#0866E9] dark:text-blue-400" />
          </div>
          <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
            POS & RETAIL SYSTEM v4.0.0
          </p>
          <div className="mt-2.5 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 px-2.5 py-0.5 rounded-full text-[9px] font-medium">
            <ShieldCheck size={11} />
            <span>Lisensi Enterprise Terverifikasi</span>
          </div>
        </div>

        {/* 3. Spesifikasi Arsitektur Sistem */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-2xs space-y-2 shrink-0 transition-colors">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <Cpu size={14} className="text-[#0866E9] dark:text-blue-400" />
            <h4 className="text-[10.5px] font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Arsitektur Mobile POS</h4>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Layers size={11} className="text-slate-400" /> Layout Engine:
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">Zero-Scroll Viewport</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <Database size={11} className="text-slate-400" /> Basis Data:
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">Dexie IndexedDB (Offline-First)</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-slate-400" /> UI Framework:
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">React + TailwindCSS</span>
            </div>
          </div>
        </div>

        {/* 4. Fitur Inti Toko */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-2xs shrink-0 transition-colors">
          <h4 className="text-[10px] font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-1.5">Fitur Unggulan</h4>
          <ul className="text-[9.5px] text-slate-600 dark:text-slate-400 space-y-1 font-normal list-disc list-inside">
            <li>Kasir cepat dengan pemindai barcode kamera & manual</li>
            <li>Manajemen shift kasir dan rekonsiliasi kas laci</li>
            <li>Pencadangan & pemulihan database offline instan</li>
            <li>Laporan omzet, kuantitas item, dan laba bersih harian</li>
          </ul>
        </div>

        {/* 5. Catatan Footer */}
        <div className="shrink-0">
          <p className="text-center text-[8.5px] text-slate-400 font-medium leading-tight">
            Didesain presisi untuk operasional kasir ritel cepat dan efisien.
          </p>
          <a
            href="https://wa.me/6281113900923"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[10px] font-normal text-slate-400 tracking-wide mt-1 text-center hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Developer Support: 0811-1390-0923
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;