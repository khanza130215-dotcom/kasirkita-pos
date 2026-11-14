import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  FileCode2
} from 'lucide-react';
import { db } from '../db/db';

export const BackupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      const products = await db.table('products').toArray();
      const transactions = await db.table('transactions').toArray();

      const backupData = {
        version: '4.0.0',
        timestamp: new Date().toISOString(),
        data: { products, transactions }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jacs-pos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Cadangan data berhasil diunduh!');
    } catch {
      showToast('Gagal mencadangkan data');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.data) throw new Error('Format salah');

        if (parsed.data.products) {
          await db.table('products').clear();
          await db.table('products').bulkAdd(parsed.data.products);
        }
        if (parsed.data.transactions) {
          await db.table('transactions').clear();
          await db.table('transactions').bulkAdd(parsed.data.transactions);
        }
        showToast('Data berhasil dipulihkan!');
      } catch {
        showToast('File backup rusak/tidak valid');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col justify-between p-2.5 overflow-hidden select-none bg-slate-50 dark:bg-slate-950 gap-2 transition-colors duration-200">
      {/* 1. Header dengan Tombol Kembali ke Menu */}
      <div className="flex items-center justify-between pt-0.5 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/menu')}
            className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[#0866E9] dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500/50 active:scale-95 transition-all cursor-pointer"
            title="Kembali ke Menu"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">Backup & Restore</h1>
            <p className="text-[8.5px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Keamanan Database</p>
          </div>
        </div>

        {toastMsg && (
          <span className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2 py-0.5 rounded-full animate-fade-in">
            <CheckCircle2 size={11} /> {toastMsg}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5 custom-scrollbar">
        {/* Banner Info */}
        <div className="bg-gradient-to-r from-blue-600 to-[#0866E9] rounded-2xl p-3 text-white shadow-xs border border-white/20 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <h3 className="text-xs font-black tracking-tight">Database Offline Aman</h3>
          </div>
          <p className="text-[9.5px] text-blue-100 leading-snug">
            Data tersimpan di penyimpanan internal peramban. Lakukan cadangan rutin ke file JSON agar aman saat berganti perangkat.
          </p>
        </div>

        {/* Cadangkan Data */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-2xs flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#0866E9] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/70">
              <Download size={14} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 leading-none">Cadangkan Data (Backup)</h4>
              <p className="text-[8.5px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">Unduh seluruh file database ke HP</p>
            </div>
          </div>
          <button
            onClick={handleBackup}
            disabled={loading}
            className="w-full py-2 bg-[#0866E9] hover:bg-blue-600 text-white font-black text-xs rounded-xl shadow-xs shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-98 transition-all tracking-wider uppercase cursor-pointer"
          >
            <Download size={13} />
            <span>{loading ? 'Memproses...' : 'Unduh File Database'}</span>
          </button>
        </div>

        {/* Pulihkan Data */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-2xs flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center text-[#FF7900] dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/70">
              <Upload size={14} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 leading-none">Pulihkan Data (Restore)</h4>
              <p className="text-[8.5px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">Muat kembali cadangan dari file JSON</p>
            </div>
          </div>

          <label className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 active:scale-98 transition-all tracking-wider uppercase cursor-pointer">
            <FileCode2 size={13} className="text-[#0866E9] dark:text-blue-400" />
            <span>Pilih File .JSON Cadangan</span>
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </div>

        {/* Kotak Peringatan */}
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/70 rounded-xl p-2.5 flex items-start gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[9px] text-amber-800 dark:text-amber-300 font-medium leading-tight">
            Memulihkan file akan menimpa stok dan transaksi yang ada saat ini. Pastikan memilih file backup yang sesuai.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupPage;