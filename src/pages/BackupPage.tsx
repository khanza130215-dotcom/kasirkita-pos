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
    <div className="h-full overflow-y-auto px-3 pt-2.5 pb-4 bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white select-none transition-colors duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-2.5">
        {/* 1. Header dengan Tombol Kembali ke Menu */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] shadow-2xs flex items-center justify-center text-[#172033] dark:text-white hover:border-[#0866E9] dark:hover:border-[#FF7900] active:scale-95 transition-all cursor-pointer shrink-0"
              title="Kembali ke Menu"
              aria-label="Kembali ke Menu"
            >
              <ArrowLeft size={17} strokeWidth={2.25} />
            </button>
            <div className="min-w-0">
              <h1 className="text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">
                Backup & Restore
              </h1>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 leading-tight">
                Keamanan database lokal
              </p>
            </div>
          </div>

          {toastMsg && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2.5 py-1 rounded-xl shrink-0">
              <CheckCircle2 size={13} /> {toastMsg}
            </span>
          )}
        </div>

        {/* Banner Info */}
        <div className="bg-gradient-to-r from-[#0866E9] to-[#024BB5] rounded-xl p-3 text-white shadow-2xs border border-[#0866E9]/20">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <h2 className="text-[13.5px] font-semibold tracking-tight leading-tight">Database Offline Aman</h2>
          </div>
          <p className="text-[12px] text-blue-100 font-normal leading-snug">
            Data tersimpan di penyimpanan internal peramban. Lakukan cadangan rutin ke file JSON agar aman saat berganti perangkat.
          </p>
        </div>

        {/* Cadangkan Data */}
        <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 shadow-2xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#0866E9]/15 flex items-center justify-center text-[#0866E9] dark:text-blue-400 border border-blue-200/70 dark:border-[#0866E9]/40 shrink-0">
              <Download size={16} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-[13.5px] font-semibold text-[#172033] dark:text-white leading-tight">
                Cadangkan Data (Backup)
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 leading-tight">
                Unduh seluruh file database ke perangkat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleBackup}
            disabled={loading}
            className="w-full min-h-[44px] py-2 bg-[#0866E9] hover:bg-[#0758CC] text-white font-semibold text-[12.5px] rounded-xl shadow-2xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-45"
          >
            <Download size={15} />
            <span>{loading ? 'Memproses...' : 'Unduh File Database'}</span>
          </button>
        </div>

        {/* Pulihkan Data */}
        <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 shadow-2xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-[#FF7900]/15 flex items-center justify-center text-[#FF7900] border border-orange-200/70 dark:border-[#FF7900]/40 shrink-0">
              <Upload size={16} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-[13.5px] font-semibold text-[#172033] dark:text-white leading-tight">
                Pulihkan Data (Restore)
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 leading-tight">
                Muat kembali cadangan dari file JSON
              </p>
            </div>
          </div>

          <label className="w-full min-h-[44px] py-2 bg-[#F1F4F8] dark:bg-[#070B16] hover:border-[#0866E9] dark:hover:border-[#FF7900] text-[#172033] dark:text-white font-semibold text-[12.5px] rounded-xl border border-[#E2E8F0] dark:border-[#263954] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer">
            <FileCode2 size={15} className="text-[#0866E9] dark:text-[#FF7900]" />
            <span>Pilih File .JSON Cadangan</span>
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </div>

        {/* Kotak Peringatan */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-xl p-2.5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-[#FF7900] shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-normal leading-snug">
            Memulihkan file akan menimpa stok dan transaksi yang ada saat ini. Pastikan memilih file backup yang sesuai.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupPage;