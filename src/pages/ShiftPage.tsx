import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Unlock,
  DollarSign,
  CheckCircle2,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { Shift } from '../types';

export const ShiftPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shiftSalesTotal, setShiftSalesTotal] = useState<number>(0);
  const [cashierName, setCashierName] = useState('Kasir Utama');
  const [initialCashInput, setInitialCashInput] = useState('200000');
  const [actualCash, setActualCash] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadActiveShift = async () => {
    try {
      const current = await shiftService.getActiveShift();
      setActiveShift(current ?? null);
      if (current?.id) {
        const stats = await shiftService.getShiftSummary(current.id);
        const total = Object.values(stats.summary).reduce((s, v) => s + v, 0);
        setShiftSalesTotal(total);
      } else {
        setShiftSalesTotal(0);
      }
    } catch (err) {
      console.error('Gagal memuat status shift:', err);
    }
  };

  useEffect(() => {
    loadActiveShift();
  }, []);

  const showToast = (msg: string) => {
    setErrorMsg(null);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const handleToggleShift = async () => {
    setErrorMsg(null);
    if (activeShift?.id) {
      if (!actualCash.trim()) {
        setErrorMsg('Masukkan hitungan uang fisik di laci sebelum menutup shift.');
        return;
      }
      await shiftService.closeShift(activeShift.id);
      setActualCash('');
      await loadActiveShift();
      showToast('Shift ditutup & rekap kas tersimpan!');
    } else {
      const parsedCash = Number(initialCashInput.replace(/\D/g, '')) || 0;
      if (parsedCash < 0) {
        setErrorMsg('Nominal modal awal tidak valid.');
        return;
      }
      await shiftService.openShift(cashierName.trim() || 'Kasir Utama', parsedCash);
      await loadActiveShift();
      showToast('Shift baru berhasil dibuka!');
    }
  };

  const shiftActive = Boolean(activeShift);

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
            <h1 className="text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              Manajemen Shift
            </h1>
            <p className="text-[8.5px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
              Buka & Tutup Kasir
            </p>
          </div>
        </div>

        {toastMsg && (
          <span className="flex items-center gap-1 text-[9.5px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={11} /> {toastMsg}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5 custom-scrollbar">
        {/* 2. Status Shift Banner Dinamis */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between text-white shadow-xs shrink-0 ${
            shiftActive
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400/30'
              : 'bg-gradient-to-r from-slate-700 to-slate-900 border-slate-600'
          }`}
        >
          <div>
            <span className="text-[8.5px] font-medium uppercase tracking-widest block text-emerald-100">
              Status Kasir
            </span>
            <span className="text-base font-semibold tracking-tight">
              {shiftActive ? 'SHIFT SEDANG AKTIF' : 'SHIFT DITUTUP'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            {shiftActive ? <Unlock size={16} /> : <Lock size={16} />}
          </div>
        </div>

        {/* 3. Informasi Kas Operasional / Form Buka Shift */}
        {shiftActive && activeShift ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-2xs space-y-2 shrink-0 transition-colors">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px] flex items-center gap-1">
                <UserCheck size={12} className="text-[#0866E9] dark:text-blue-400" /> Kasir Bertugas:
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{activeShift.cashierName}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">Modal Awal Laci:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                Rp {activeShift.initialCash.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">
                Penjualan Kas Shift Ini:
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                Rp {shiftSalesTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-2xs space-y-2.5 shrink-0 transition-colors">
            <div className="space-y-1">
              <label className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Nama Kasir Bertugas
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-500">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Nama kasir..."
                  className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Modal Awal Laci (Rp)
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-500">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="number"
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  placeholder="Masukkan nominal modal awal..."
                  className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 outline-none tabular-nums"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Form Hitung Kas Laci (Saat Shift Aktif) */}
        {shiftActive && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-2xs space-y-2 shrink-0 transition-colors">
            <label className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Hitung Uang Fisik di Laci (Tutup Kas)
            </label>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:shadow-[0_0_8px_rgba(59,130,246,0.15)] transition-all">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="Masukkan nominal uang laci..."
                className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-400 text-xs px-3 py-2 rounded-xl shrink-0">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 5. Tombol Aksi Shift */}
        <button
          onClick={handleToggleShift}
          className={`w-full py-2.5 font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all tracking-wider uppercase cursor-pointer shrink-0 ${
            shiftActive
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
              : 'bg-[#0866E9] hover:bg-blue-600 text-white shadow-blue-500/20'
          }`}
        >
          {shiftActive ? <Lock size={13} /> : <Unlock size={13} />}
          <span>{shiftActive ? 'Tutup Shift & Rekap Kas' : 'Buka Shift Baru'}</span>
        </button>

        {shiftActive && (
          <button
            type="button"
            onClick={() => navigate('/kasir')}
            className="w-full py-2 font-medium text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-500/50 hover:text-[#0866E9] dark:hover:text-blue-400 transition-all cursor-pointer shrink-0"
          >
            Lanjut ke Halaman Kasir
          </button>
        )}
      </div>
    </div>
  );
};

export default ShiftPage;