import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Wallet, 
  Tag, 
  FileText, 
  PlusCircle, 
  Receipt, 
  Calendar,
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface ExpenseItem {
  id: number;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export const ExpensesPage: React.FC = () => {
  const navigate = useNavigate();

  // Kategori operasional yang relevan khusus ritel/toko POS
  const retailCategories = [
    'Belanja Stok / Kulakan',
    'Listrik & Air Toko',
    'Uang Makan / Konsumsi',
    'Plastik & Perlengkapan',
    'Biaya Kebersihan & Sampah',
    'Lain-lain'
  ];

  const [category, setCategory] = useState(retailCategories[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: 1,
      category: 'Plastik & Perlengkapan',
      amount: 35000,
      description: 'Beli kresek & lakban',
      date: '10:15 WIB'
    },
    {
      id: 2,
      category: 'Uang Makan / Konsumsi',
      amount: 25000,
      description: 'Makan siang kasir',
      date: '12:30 WIB'
    }
  ]);
  const [savedToast, setSavedToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseInt(amount.replace(/\D/g, ''), 10);
    if (!nominal || nominal <= 0) return;

    const newExpense: ExpenseItem = {
      id: Date.now(),
      category,
      amount: nominal,
      description: description || '-',
      date: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    };

    setExpenses([newExpense, ...expenses]);
    setAmount('');
    setDescription('');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleDelete = (id: number) => {
    setExpenses(expenses.filter(item => item.id !== id));
  };

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="h-full flex flex-col justify-between p-2.5 overflow-hidden select-none bg-slate-50 dark:bg-slate-950 gap-2 transition-colors duration-200">
      {/* 1. Header Dinamis dengan Tombol Kembali ke Menu */}
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
            <h1 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">Pengeluaran Kas</h1>
            <p className="text-[8.5px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Petty Cash Operasional</p>
          </div>
        </div>

        {savedToast && (
          <span className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2 py-0.5 rounded-full animate-fade-in">
            <CheckCircle2 size={11} /> Tersimpan
          </span>
        )}
      </div>

      {/* 2. Kartu Form Input Pengeluaran (Glow Aksen Modern) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 shadow-2xs shrink-0">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Dropdown Kategori Ritel */}
          <div>
            <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Kategori Keperluan
            </label>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:shadow-[0_0_8px_rgba(59,130,246,0.15)] transition-all">
              <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                {retailCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris Nominal & Keterangan */}
          <div className="grid grid-cols-12 gap-1.5">
            <div className="col-span-5">
              <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Nominal (Rp)
              </label>
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:shadow-[0_0_8px_rgba(59,130,246,0.15)] transition-all">
                <Wallet className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                <input 
                  type="text"
                  value={amount}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setAmount(val ? Number(val).toLocaleString('id-ID') : '');
                  }}
                  placeholder="0"
                  className="w-full bg-transparent text-xs font-black text-slate-900 dark:text-slate-100 outline-none tabular-nums placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div className="col-span-7">
              <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Catatan / Deskripsi
              </label>
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:shadow-[0_0_8px_rgba(59,130,246,0.15)] transition-all">
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <input 
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: Beli es batu..."
                  className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Tombol Simpan */}
          <button 
            type="submit"
            className="w-full py-2 bg-[#0866E9] hover:bg-blue-600 text-white font-black text-xs rounded-xl shadow-xs shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-98 transition-all tracking-wider uppercase cursor-pointer"
          >
            <PlusCircle size={13} strokeWidth={2.5} />
            <span>Simpan Pengeluaran</span>
          </button>
        </form>
      </div>

      {/* 3. Daftar Riwayat Pengeluaran (Internal Scroll Pas 1 Layar) */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs flex flex-col overflow-hidden">
        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-1.5">
            <Receipt className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <h2 className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Riwayat Pengeluaran Hari Ini</h2>
          </div>
          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 tabular-nums">
            Total: Rp {totalExpense.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {expenses.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-6 opacity-40">
              <Calendar className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">Belum ada catatan pengeluaran</p>
            </div>
          ) : (
            expenses.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-blue-500/50 transition-all"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">{item.category}</span>
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-400 font-medium mt-0.5 truncate">
                    {item.date} • {item.description}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 tabular-nums">
                    -Rp {item.amount.toLocaleString('id-ID')}
                  </span>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;