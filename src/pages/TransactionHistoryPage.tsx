import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Receipt, 
  ChevronRight, 
  Clock, 
  Printer
} from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { TransactionWithDetails } from '../types';
import { formatRupiah } from '../utils/paymentUtils';

export const TransactionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<TransactionWithDetails | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    transactionService.getAllTransactions().then(setTransactions);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const filtered = transactions.filter(t => 
    t.id?.toString().includes(search) || 
    t.paymentMethod?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-3 overflow-y-auto md:overflow-hidden pb-4 select-none bg-[#F1F4F8] dark:bg-[#070B16] gap-2.5 relative transition-colors duration-200">
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#172033] dark:bg-[#111D30] text-white text-xs font-medium px-3.5 py-2 rounded-xl shadow-xl border border-[#263954]">
          {toastMsg}
        </div>
      )}

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
            <h1 className="text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">Riwayat Transaksi</h1>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 leading-tight">Semua struk selesai</p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-[#0866E9] dark:text-[#FF7900] bg-blue-50 dark:bg-[#FF7900]/15 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-[#FF7900]/40 tabular-nums">
          {filtered.length} Nota
        </span>
      </div>

      {/* 2. Bar Pencarian Struk */}
      <div className="h-10 flex items-center gap-2 bg-white dark:bg-[#111D30] px-3 rounded-xl border border-[#E2E8F0] dark:border-[#263954] focus-within:border-[#0866E9] dark:focus-within:border-[#FF7900] transition-colors shrink-0">
        <Search size={15} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" strokeWidth={2} />
        <input 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nomor struk atau metode..."
          className="w-full bg-transparent text-[12.5px] font-normal text-[#172033] dark:text-white outline-none placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8]"
        />
      </div>

      {/* 3. Daftar Transaksi */}
      <div className="flex-1 min-h-[260px] bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-6 text-center">
              <Receipt className="w-7 h-7 text-[#64748B]/40 dark:text-[#94A3B8]/40" />
              <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Belum ada transaksi</p>
            </div>
          ) : (
            filtered.map((tx, idx) => (
              <button
                type="button"
                key={tx.id || idx}
                onClick={() => setSelectedTx(tx)}
                className="w-full min-h-[44px] text-left px-2.5 py-2 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#0866E9]/20 flex items-center justify-center text-[#0866E9] dark:text-blue-400 border border-blue-200/70 dark:border-blue-500/30 shrink-0">
                    <Receipt size={15} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight block truncate">TRX-{tx.id || idx + 1000}</span>
                    <span className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 flex items-center gap-1 leading-tight">
                      <Clock size={11} /> {new Date(tx.createdAt || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {tx.paymentMethod?.toUpperCase() || 'TUNAI'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[13px] font-semibold text-[#172033] dark:text-white tabular-nums">
                    {formatRupiah(tx.finalAmount || tx.totalAmount || 0)}
                  </span>
                  <ChevronRight size={14} className="text-[#64748B] dark:text-[#94A3B8]" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 4. Popover Detail & Cetak Struk */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#111D30] rounded-2xl w-full max-w-xs p-3.5 shadow-xl border border-[#E2E8F0] dark:border-[#263954] flex flex-col gap-2.5">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-[#263954] pb-2">
              <span className="text-[13.5px] font-semibold text-[#172033] dark:text-white">Detail Nota #TRX-{selectedTx.id}</span>
              <button onClick={() => setSelectedTx(null)} className="min-h-[44px] px-2.5 py-1 rounded-lg text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white cursor-pointer">Tutup</button>
            </div>
            
            <div className="space-y-1.5 text-[12.5px]">
              <div className="flex justify-between text-[#64748B] dark:text-[#94A3B8]">
                <span>Metode Bayar:</span>
                <span className="font-medium text-[#172033] dark:text-white">{selectedTx.paymentMethod || 'TUNAI'}</span>
              </div>
              <div className="flex justify-between items-baseline text-[#172033] dark:text-white pt-1.5 border-t border-[#E2E8F0] dark:border-[#263954]">
                <span className="text-[12.5px] font-medium">Total:</span>
                <span className="text-[20px] font-bold text-[#0866E9] dark:text-[#FF7900] tabular-nums leading-tight">{formatRupiah(selectedTx.finalAmount || selectedTx.totalAmount || 0)}</span>
              </div>
            </div>

            <button 
              onClick={() => { showToast('Perintah cetak struk dikirim ke printer thermal.'); setSelectedTx(null); }}
              className="w-full min-h-[44px] py-2 bg-[#0866E9] hover:bg-[#0758CC] text-white font-semibold text-[12.5px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Printer size={15} />
              <span>Cetak Ulang Struk</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryPage;