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
    <div className="h-full overflow-y-auto px-3 pt-2.5 pb-4 bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white select-none transition-colors duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-2.5">
        {/* 1. Header Dinamis dengan Tombol Kembali ke Menu */}
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
                Pengeluaran Kas
              </h1>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 leading-tight">
                Catatan petty cash operasional
              </p>
            </div>
          </div>

          {savedToast && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2.5 py-1 rounded-xl shrink-0">
              <CheckCircle2 size={13} /> Tersimpan
            </span>
          )}
        </div>

        {/* 2. Kartu Form Input Pengeluaran */}
        <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 shadow-2xs">
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Dropdown Kategori Ritel */}
            <div>
              <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] block mb-1">
                Kategori Keperluan
              </label>
              <div className="min-h-[44px] h-11 flex items-center gap-2 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-2.5 focus-within:border-[#0866E9] dark:focus-within:border-[#FF7900] transition-colors">
                <Tag className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full h-full min-h-[44px] bg-transparent text-[12.5px] font-normal text-[#172033] dark:text-white outline-none cursor-pointer"
                >
                  {retailCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-white dark:bg-[#111D30] text-[#172033] dark:text-white">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Baris Nominal & Keterangan */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] block mb-1">
                  Nominal (Rp)
                </label>
                <div className="h-10 flex items-center gap-2 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-2.5 focus-within:border-[#0866E9] dark:focus-within:border-[#FF7900] transition-colors">
                  <Wallet className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                  <input
                    type="text"
                    value={amount}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setAmount(val ? Number(val).toLocaleString('id-ID') : '');
                    }}
                    placeholder="0"
                    className="w-full bg-transparent text-[12.5px] font-semibold text-[#172033] dark:text-white outline-none tabular-nums placeholder:text-[#64748B]/70 dark:placeholder:text-[#94A3B8]/60"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-7">
                <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] block mb-1">
                  Catatan / Deskripsi
                </label>
                <div className="h-10 flex items-center gap-2 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-2.5 focus-within:border-[#0866E9] dark:focus-within:border-[#FF7900] transition-colors">
                  <FileText className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Contoh: Beli es batu..."
                    className="w-full bg-transparent text-[12.5px] font-normal text-[#172033] dark:text-white outline-none placeholder:text-[#64748B]/70 dark:placeholder:text-[#94A3B8]/60"
                  />
                </div>
              </div>
            </div>

            {/* Tombol Simpan */}
            <button
              type="submit"
              className="w-full min-h-[44px] py-2 bg-[#0866E9] hover:bg-[#0758CC] text-white font-semibold text-[12.5px] rounded-xl shadow-2xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusCircle size={15} strokeWidth={2.25} />
              <span>Simpan Pengeluaran</span>
            </button>
          </form>
        </div>

        {/* 3. Daftar Riwayat Pengeluaran */}
        <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl shadow-2xs flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[#E2E8F0] dark:border-[#263954] flex justify-between items-center gap-2 bg-[#F1F4F8]/60 dark:bg-[#070B16]/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <Receipt className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
              <h2 className="text-[13.5px] font-semibold text-[#172033] dark:text-white truncate leading-tight">
                Riwayat Pengeluaran Hari Ini
              </h2>
            </div>
            <span className="text-[13px] font-semibold text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
              Rp {totalExpense.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-2.5 space-y-1.5">
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-[#64748B] dark:text-[#94A3B8]">
                <Calendar className="w-6 h-6 opacity-50" />
                <p className="text-xs font-medium mt-1">Belum ada catatan pengeluaran</p>
              </div>
            ) : (
              expenses.map(item => (
                <div
                  key={item.id}
                  className="min-h-[44px] flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] transition-colors"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight truncate">{item.category}</span>
                    <span className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 truncate leading-tight">
                      {item.date} · {item.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[12.5px] font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                      -Rp {item.amount.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      aria-label="Hapus pengeluaran"
                      className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;