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
    <div className="h-full flex flex-col p-3 overflow-y-auto pb-4 select-none bg-[#F1F4F8] dark:bg-[#070B16] gap-2.5 transition-colors duration-200">
      {/* 1. Header dengan Tombol Kembali ke Menu */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/menu')}
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] flex items-center justify-center text-[#172033] dark:text-white hover:border-[#0866E9] dark:hover:border-[#FF7900] active:scale-95 transition-all cursor-pointer"
            title="Kembali ke Menu"
          >
            <ArrowLeft size={17} strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">Tentang Aplikasi</h1>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 leading-tight">Identitas & Arsitektur POS</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {/* 2. Hero Developer Card JacS Enterprise */}
        <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl py-3 px-3 flex flex-col items-center justify-center text-center shrink-0 transition-colors">
          <img 
            src="/logo-jacs-enterprise_a5443089.png" 
            alt="JacS Enterprise" 
            className="w-10 h-10 object-contain mb-2 select-none"
          />
          <div className="flex items-center gap-1.5">
            <h2 className="text-[14px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">JacS Enterprise</h2>
            <ShoppingCart className="w-3.5 h-3.5 text-[#0866E9] dark:text-[#FF7900]" />
          </div>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-0.5">
            POS & Retail System v4.0.0
          </p>
          <div className="mt-2 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium">
            <ShieldCheck size={12} />
            <span>Lisensi Enterprise Terverifikasi</span>
          </div>
        </div>

        {/* 3. Spesifikasi Arsitektur Sistem */}
        <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 space-y-1.5 shrink-0 transition-colors">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#E2E8F0] dark:border-[#263954]">
            <Cpu size={15} className="text-[#0866E9] dark:text-[#FF7900]" />
            <h4 className="text-[13.5px] font-semibold text-[#172033] dark:text-white leading-tight">Arsitektur Mobile POS</h4>
          </div>
          <div className="space-y-1.5 text-[12px]">
            <div className="min-h-[28px] flex justify-between items-center text-[#64748B] dark:text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <Layers size={13} className="text-[#64748B] dark:text-[#94A3B8]" /> Layout Engine:
              </span>
              <span className="font-medium text-[#172033] dark:text-white">Mobile Responsive Viewport</span>
            </div>
            <div className="min-h-[28px] flex justify-between items-center text-[#64748B] dark:text-[#94A3B8] pt-1.5 border-t border-[#E2E8F0] dark:border-[#263954]">
              <span className="flex items-center gap-1.5">
                <Database size={13} className="text-[#64748B] dark:text-[#94A3B8]" /> Basis Data:
              </span>
              <span className="font-medium text-[#172033] dark:text-white">Dexie IndexedDB (Offline-First)</span>
            </div>
            <div className="min-h-[28px] flex justify-between items-center text-[#64748B] dark:text-[#94A3B8] pt-1.5 border-t border-[#E2E8F0] dark:border-[#263954]">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#64748B] dark:text-[#94A3B8]" /> UI Framework:
              </span>
              <span className="font-medium text-[#172033] dark:text-white">React + TailwindCSS</span>
            </div>
          </div>
        </div>

        {/* 4. Fitur Inti Toko */}
        <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 shrink-0 transition-colors">
          <h4 className="text-[13.5px] font-semibold text-[#172033] dark:text-white mb-1.5 leading-tight">Fitur Unggulan</h4>
          <ul className="text-[12px] text-[#64748B] dark:text-[#94A3B8] space-y-1 font-normal list-disc list-inside leading-snug">
            <li>Kasir cepat dengan pemindai barcode kamera & manual</li>
            <li>Manajemen shift kasir dan rekonsiliasi kas laci</li>
            <li>Pencadangan & pemulihan database offline instan</li>
            <li>Laporan omzet, kuantitas item, dan laba bersih harian</li>
          </ul>
        </div>

        {/* 5. Catatan Footer */}
        <div className="shrink-0 pt-0.5">
          <p className="text-center text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal leading-snug">
            Didesain presisi untuk operasional kasir ritel cepat dan efisien.
          </p>
          <a
            href="https://wa.me/6281113900923"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] flex items-center justify-center text-[12px] font-medium text-[#0866E9] dark:text-[#FF7900] mt-0.5 text-center hover:underline transition-colors"
          >
            Developer Support: 0811-1390-0923
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;