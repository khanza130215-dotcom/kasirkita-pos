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

  if (!trans) return <div className="p-10 text-center text-sm text-[#64748B] dark:text-[#94A3B8]">Memuat rincian transaksi...</div>;

  return (
    <div className="h-full overflow-y-auto p-3 pb-4 bg-[#F1F4F8] dark:bg-[#070B16] space-y-2.5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] flex items-center justify-center text-[#172033] dark:text-white hover:border-[#0866E9] dark:hover:border-[#FF7900] active:scale-95 transition-all cursor-pointer"
          title="Kembali"
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
        <h1 className="page-title">Rincian Transaksi</h1>
      </div>

      <div className="bg-white dark:bg-[#111D30] p-3 rounded-xl border border-dashed border-[#E2E8F0] dark:border-[#263954] flex flex-col items-center">
        <div id="receipt-preview" className="bg-white text-black p-3 shadow-md border border-[#E2E8F0] rounded-sm">
          <Receipt trans={trans} items={items} payments={payments} store={store} width={printerSize} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => window.print()} 
          className="flex-1 min-h-[44px] bg-[#0866E9] hover:bg-[#0758CC] text-white rounded-xl font-semibold text-[12.5px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Printer size={16} /> Cetak Struk
        </button>
        <button 
          onClick={() => navigate('/menu')} 
          className="flex-1 min-h-[44px] bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl font-semibold text-[12.5px] text-[#172033] dark:text-white hover:border-[#0866E9] dark:hover:border-[#FF7900] active:scale-[0.98] transition-all cursor-pointer"
        >
          Kembali
        </button>
      </div>
    </div>
  );
};
