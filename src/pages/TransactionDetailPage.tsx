import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionService } from '../services/transactionService';
import { settingsService } from '../services/settingsService';
import { Transaction, TransactionItem, Payment } from '../types';
import { Printer, ArrowLeft } from 'lucide-react';
import { Receipt } from '../components/receipt/Receipt';

export const TransactionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trans, setTrans] = useState<Transaction | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [store, setStore] = useState<any>(null);
  const [printerSize, setPrinterSize] = useState('80');

  useEffect(() => {
    if (id) {
      transactionService.getTransactionById(id).then(t => setTrans(t || null));
      transactionService.getTransactionItems(id).then(setItems);
      transactionService.getTransactionPayments(id).then(setPayments);
      settingsService.getSettings().then(s => {
        setStore(s);
        if (s.paperSize) setPrinterSize(s.paperSize.replace('mm', ''));
      });
    }
  }, [id]);

  if (!trans) return <div className="p-10 text-center text-gray-400">Memuat rincian transaksi...</div>;

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-[#111D30] border border-gray-200 dark:border-[#263954] rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <h1 className="page-title">Rincian Transaksi</h1>
      </div>

      <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-[#263954] flex flex-col items-center">
        <div id="receipt-preview" className="bg-white text-black p-4 shadow-xl border border-gray-100 rounded-sm">
          <Receipt trans={trans} items={items} payments={payments} store={store} width={printerSize} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => window.print()} 
          className="flex-1 h-12 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <Printer size={18} /> Cetak Struk
        </button>
        <button 
          onClick={() => navigate('/menu')} 
          className="flex-1 h-12 bg-white dark:bg-[#111D30] border border-gray-200 dark:border-[#263954] rounded-xl font-bold text-sm text-gray-500 active:scale-95 transition-all"
        >
          Kembali
        </button>
      </div>
    </div>
  );
};
