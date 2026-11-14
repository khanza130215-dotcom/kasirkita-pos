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
                Manajemen Shift
              </h1>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal leading-tight mt-0.5">
                Buka & tutup kasir harian
              </p>
            </div>
          </div>

          {toastMsg && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2.5 py-1 rounded-xl shrink-0">
              <CheckCircle2 size={13} /> {toastMsg}
            </span>
          )}
        </div>

        {/* 2. Status Shift Banner Dinamis */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-white shadow-2xs ${
            shiftActive
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500/40'
              : 'bg-gradient-to-r from-slate-700 to-slate-900 border-[#263954]'
          }`}
        >
          <div>
            <span className="text-[11px] font-medium text-emerald-100 block leading-tight">
              Status Kasir
            </span>
            <span className="text-[15px] font-semibold tracking-tight mt-0.5 block leading-tight">
              {shiftActive ? 'Shift Sedang Aktif' : 'Shift Ditutup'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            {shiftActive ? <Unlock size={17} /> : <Lock size={17} />}
          </div>
        </div>

        {/* 3. Informasi Kas Operasional / Form Buka Shift */}
        {shiftActive && activeShift ? (
          <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 shadow-2xs space-y-1.5 transition-colors">
            <div className="min-h-[30px] flex justify-between items-center text-[12.5px]">
              <span className="text-[#64748B] dark:text-[#94A3B8] font-normal flex items-center gap-1.5">
                <UserCheck size={14} className="text-[#0866E9] dark:text-[#FF7900]" /> Kasir Bertugas
              </span>
              <span className="font-medium text-[#172033] dark:text-white">{activeShift.cashierName}</span>
            </div>
            <div className="min-h-[30px] flex justify-between items-center text-[12.5px] pt-1.5 border-t border-[#E2E8F0] dark:border-[#263954]">
              <span className="text-[#64748B] dark:text-[#94A3B8] font-normal">Modal Awal Laci</span>
              <span className="font-semibold text-[#172033] dark:text-white tabular-nums">
                Rp {activeShift.initialCash.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="min-h-[34px] flex justify-between items-center text-[12.5px] pt-1.5 border-t border-[#E2E8F0] dark:border-[#263954]">
              <span className="text-[#64748B] dark:text-[#94A3B8] font-normal">
                Penjualan Kas Shift Ini
              </span>
              <span className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">
                Rp {shiftSalesTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 shadow-2xs space-y-2.5 transition-colors">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] block">
                Nama Kasir Bertugas
              </label>
              <div className="h-10 flex items-center gap-2 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-2.5 focus-within:border-[#0866E9] dark:focus-within:border-[#FF7900] transition-colors">
                <UserCheck className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                <input
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Nama kasir..."
                  className="w-full bg-transparent text-[12.5px] font-normal text-[#172033] dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] block">
                Modal Awal Laci (Rp)
              </label>
              <div className="h-10 flex items-center gap-2 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-2.5 focus-within:border-[#0866E9] dark:focus-within:border-[#FF7900] transition-colors">
                <DollarSign className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                <input
                  type="number"
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  placeholder="Masukkan nominal modal awal..."
                  className="w-full bg-transparent text-[12.5px] font-medium text-[#172033] dark:text-white outline-none tabular-nums"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Form Hitung Kas Laci (Saat Shift Aktif) */}
        {shiftActive && (
          <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 shadow-2xs space-y-1.5 transition-colors">
            <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] block">
              Hitung Uang Fisik di Laci (Tutup Kas)
            </label>
            <div className="h-10 flex items-center gap-2 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-2.5 focus-within:border-[#0866E9] dark:focus-within:border-[#FF7900] transition-colors">
              <DollarSign className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
              <input
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="Masukkan nominal uang laci..."
                className="w-full bg-transparent text-[12.5px] font-medium text-[#172033] dark:text-white outline-none tabular-nums"
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-400 text-[12px] px-3 py-2 rounded-xl">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 5. Tombol Aksi Shift */}
        <button
          type="button"
          onClick={handleToggleShift}
          className={`w-full min-h-[44px] py-2 font-semibold text-[12.5px] rounded-xl shadow-2xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${
            shiftActive
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-[#0866E9] hover:bg-[#0758CC] text-white'
          }`}
        >
          {shiftActive ? <Lock size={15} /> : <Unlock size={15} />}
          <span>{shiftActive ? 'Tutup Shift & Rekap Kas' : 'Buka Shift Baru'}</span>
        </button>

        {shiftActive && (
          <button
            type="button"
            onClick={() => navigate('/kasir')}
            className="w-full min-h-[44px] py-2 font-medium text-[12.5px] rounded-xl border border-[#E2E8F0] dark:border-[#263954] bg-white dark:bg-[#111D30] text-[#172033] dark:text-white hover:border-[#0866E9] dark:hover:border-[#FF7900] transition-all cursor-pointer"
          >
            Lanjut ke Halaman Kasir
          </button>
        )}
      </div>
    </div>
  );
};

export default ShiftPage;