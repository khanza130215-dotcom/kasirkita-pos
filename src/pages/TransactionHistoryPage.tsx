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
    <div className="h-full flex flex-col justify-between p-2.5 overflow-hidden select-none bg-slate-50 dark:bg-slate-950 gap-2 relative transition-colors duration-200">
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-xl shadow-xl border border-slate-700/50">
          {toastMsg}
        </div>
      )}

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
            <h1 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">Riwayat Transaksi</h1>
            <p className="text-[8.5px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Semua Struk Selesai</p>
          </div>
        </div>
        <span className="text-[9px] font-black text-[#0866E9] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/70">
          {filtered.length} Nota
        </span>
      </div>

      {/* 2. Bar Pencarian Struk */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-slate-700 shadow-[0_0_8px_rgba(59,130,246,0.15)] focus-within:border-blue-500 shrink-0">
        <Search size={14} className="text-[#0866E9] dark:text-blue-400 shrink-0" strokeWidth={2.5} />
        <input 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="CARI NOMOR STRUK / METODE..."
          className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      {/* 3. Daftar Transaksi */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-8 opacity-40">
              <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">Belum Ada Transaksi</p>
            </div>
          ) : (
            filtered.map((tx, idx) => (
              <div 
                key={tx.id || idx}
                onClick={() => setSelectedTx(tx)}
                className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 dark:hover:bg-slate-800/80 flex items-center justify-between cursor-pointer active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#0866E9] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/70">
                    <Receipt size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none block">TRX-{tx.id || idx + 1000}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {new Date(tx.createdAt || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {tx.paymentMethod?.toUpperCase() || 'TUNAI'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatRupiah(tx.finalAmount || tx.totalAmount || 0)}
                  </span>
                  <ChevronRight size={13} className="text-slate-400 dark:text-slate-500" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Popover Detail & Cetak Struk */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/65 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xs p-3.5 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">Detail Nota #TRX-{selectedTx.id}</span>
              <button onClick={() => setSelectedTx(null)} className="text-xs font-bold text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">Tutup</button>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[10px]">
                <span>Metode Bayar:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTx.paymentMethod || 'TUNAI'}</span>
              </div>
              <div className="flex justify-between text-slate-900 dark:text-slate-100 font-black text-sm pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Total:</span>
                <span className="text-[#0866E9] dark:text-blue-400">{formatRupiah(selectedTx.finalAmount || selectedTx.totalAmount || 0)}</span>
              </div>
            </div>

            <button 
              onClick={() => { showToast('Perintah cetak struk dikirim ke printer thermal.'); setSelectedTx(null); }}
              className="w-full py-2 bg-[#0866E9] hover:bg-blue-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} />
              <span>Cetak Ulang Struk</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryPage;