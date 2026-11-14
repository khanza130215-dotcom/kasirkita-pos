import React from 'react';
import { 
  BanknotesIcon, 
  QrCodeIcon, 
  ReceiptPercentIcon, 
  MagnifyingGlassIcon, 
  CubeIcon, 
  ChartBarIcon, 
  ReceiptRefundIcon, 
  UserGroupIcon, 
  ClockIcon,
  PlusCircleIcon,
  ChevronRightIcon,
  PrinterIcon,
  ShareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { settingsService } from '../services/settingsService';

interface TransactionItem {
  id: string;
  code: string;
  time: string;
  paymentMethod: string;
  cashier: string;
  status: 'SELESAI' | 'DRAFT';
  items: { name: string; qty: number; price: number }[];
  total: number;
}

const recentTransactions: TransactionItem[] = [
  {
    id: 'TRX-1024',
    code: 'TRX-1024',
    time: '12:30',
    paymentMethod: 'TUNAI',
    cashier: 'Budi (Kasir 1)',
    status: 'SELESAI',
    items: [
      { name: 'Kopi Susu Gula Aren', qty: 2, price: 18000 },
      { name: 'Roti Bakar Cokelat', qty: 1, price: 9000 }
    ],
    total: 45000
  },
  {
    id: 'TRX-1023',
    code: 'TRX-1023',
    time: '11:15',
    paymentMethod: 'QRIS',
    cashier: 'Siti (Kasir 2)',
    status: 'SELESAI',
    items: [
      { name: 'Es Teh Manis', qty: 4, price: 5000 },
      { name: 'Nasi Goreng Spesial', qty: 2, price: 50000 }
    ],
    total: 120000
  },
  {
    id: 'TRX-1022',
    code: 'TRX-1022',
    time: '10:45',
    paymentMethod: 'TUNAI',
    cashier: 'Budi (Kasir 1)',
    status: 'DRAFT',
    items: [
      { name: 'Dimsum Mentai', qty: 1, price: 15000 }
    ],
    total: 15000
  }
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [storeName, setStoreName] = React.useState<string>('TOKO FARDAN');
  const [storeLogo, setStoreLogo] = React.useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionItem | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  React.useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (isMounted) {
          if (settings?.storeName) setStoreName(settings.storeName);
          if (settings?.logo) setStoreLogo(settings.logo);
        }
      } catch (err) {
        console.error('Gagal memuat pengaturan toko:', err);
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  const handleNav = (target: string) => {
    switch (target) {
      case 'Kasir':
      case '/kasir':
        navigate('/kasir');
        break;
      case 'All Products':
      case 'Produk':
      case '/products':
        navigate('/products');
        break;
      case 'Laporan':
      case '/laporan':
        navigate('/laporan');
        break;
      case 'Biaya':
      case '/expenses':
        navigate('/expenses');
        break;
      case 'Shift':
      case '/shift':
        navigate('/shift');
        break;
      case 'Riwayat':
      case '/transactions':
        navigate('/transactions');
        break;
      case 'Menu':
      case '/menu':
        navigate('/menu');
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-1.5 md:py-2 gap-1.5 md:gap-2 select-none relative transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs px-4 py-2 rounded-xl shadow-xl border border-slate-700/50 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Command Palette / Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-300 px-4">
          <div className="w-full md:max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-slide-up">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pencarian Cepat (Command Palette)</h3>
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk atau nomor transaksi (contoh: TRX-1024)..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                autoFocus
              />
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hasil Pencarian</p>
              {searchQuery.trim() === '' ? (
                <p className="text-xs text-slate-400 text-center py-4">Ketik kata kunci untuk mencari produk atau transaksi...</p>
              ) : (
                <>
                  {recentTransactions
                    .filter(tx => tx.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(tx => (
                      <div
                        key={tx.id}
                        onClick={() => {
                          setSelectedTransaction(tx);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/70 hover:bg-blue-50/80 dark:hover:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700/80 dark:hover:border-blue-500/50 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs">Transaksi: {tx.code}</p>
                          <p className="text-[10px] text-slate-400">{tx.time} • Rp {tx.total.toLocaleString('id-ID')}</p>
                        </div>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 font-semibold px-2 py-0.5 rounded">Pilih</span>
                      </div>
                    ))}
                  <div
                    onClick={() => {
                      navigate('/products');
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/70 hover:bg-blue-50/80 dark:hover:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700/80 dark:hover:border-blue-500/50 cursor-pointer transition-all"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs">Cari di Daftar Produk ({searchQuery})</p>
                      <p className="text-[10px] text-slate-400">Buka halaman manajemen produk</p>
                    </div>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 font-semibold px-2 py-0.5 rounded">Produk</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Bottom Sheet Detail Transaksi */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-300">
          <div className="w-full md:max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-t-3xl md:rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[85dvh] overflow-y-auto animate-slide-up">
            {/* Drag handle for mobile */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto md:hidden"></div>
            
            {/* Header sheet */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">{selectedTransaction.code}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-semibold ${selectedTransaction.status === 'SELESAI' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {selectedTransaction.time} • {selectedTransaction.paymentMethod} • Kasir: {selectedTransaction.cashier}
                </p>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Rincian item */}
            <div className="space-y-2 my-1">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rincian Belanja</p>
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-2.5 space-y-2 border border-slate-100 dark:border-slate-700/80">
                {selectedTransaction.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{it.name}</p>
                      <p className="text-[10px] text-slate-400">{it.qty}x @ Rp {it.price.toLocaleString('id-ID')}</p>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Rp {(it.qty * it.price).toLocaleString('id-ID')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal / Total */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Pembayaran</span>
              <span className="text-sm md:text-base font-bold text-blue-700 dark:text-blue-400">Rp {selectedTransaction.total.toLocaleString('id-ID')}</span>
            </div>

            {/* 3 Tombol Aksi Cepat */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  showToast("Struk berhasil dikirim ke printer thermal");
                  setSelectedTransaction(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={() => {
                  showToast("Tautan struk siap dibagikan ke WhatsApp");
                  setSelectedTransaction(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Kirim WA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header Lengkap Ringkas */}
      <header className="flex-none flex items-center justify-between py-0.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {storeLogo ? (
            <img 
              src={storeLogo} 
              alt="Logo Toko" 
              className="w-6 h-6 md:w-8 md:h-8 object-contain rounded-lg select-none drop-shadow-xs"
            />
          ) : (
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-blue-700 flex items-center justify-center !text-white text-xs font-bold uppercase shadow-xs">
              {storeName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xs md:text-xl font-bold tracking-tight text-blue-950 dark:text-slate-100 leading-none uppercase">
              {storeName}
            </h1>
            <p className="hidden md:block text-xs font-medium text-slate-400 mt-0.5 tracking-wider">
              POS &amp; RETAIL SYSTEM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-800 transition-colors cursor-pointer"
            title="Cari Produk / Transaksi"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2 py-0.5 rounded-full">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] md:text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Online
            </span>
          </div>
        </div>
      </header>

      {/* 2. Grid Responsif */}
      <main className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-12 gap-2 overflow-hidden">
        
        {/* === KOLOM KIRI === */}
        <section className="flex-none md:flex-1 flex flex-col md:justify-between gap-2 md:col-span-5 lg:col-span-5 min-h-0">
          
          {/* Banner Target Penjualan */}
          <div className="flex-none bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] md:text-xs font-normal uppercase tracking-wider !text-blue-100 leading-none">
                  PENJUALAN HARI INI
                </span>
                <h2 className="text-xl md:text-3xl font-medium mt-0.5 tracking-tight !text-white leading-tight tabular-nums">
                  RP 2.450.000
                </h2>
              </div>
              <span className="text-[10px] md:text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold !text-white">
                +12%
              </span>
            </div>
            
            {/* Mini Bar Chart Sparkline */}
            <div className="h-8 md:h-10 flex items-end justify-between gap-1 px-1 my-1">
              {[40, 65, 55, 80, 70, 95, 82].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-500 ${idx === 6 ? 'bg-white' : 'bg-white/40'}`} 
                    style={{ height: `${val}%` }}
                  ></div>
                  <span className="text-[8px] text-blue-100 font-medium">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][idx]}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-1">
              <div className="flex justify-between text-[10px] md:text-xs !text-white mb-0.5 font-normal">
                <span>Target Harian (82%)</span>
                <span>Rp 3.000.000</span>
              </div>
              <div className="w-full bg-blue-950/50 rounded-full h-1.5 md:h-2 overflow-hidden">
                <div className="bg-white h-full rounded-full w-[82%] transition-all duration-500"></div>
              </div>
            </div>
          </div>

          {/* Operational Pulse Bar (3 Ringkasan Kas) */}
          <div className="flex-none grid grid-cols-3 gap-1.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-xl p-1.5 md:p-2.5 text-center shadow-xs transition-colors">
              <div className="w-5 h-5 md:w-7 md:h-7 mx-auto rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-0.5">
                <BanknotesIcon className="w-4 h-4" />
              </div>
              <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight tabular-nums">Rp 1.450k</p>
              <p className="text-[9px] md:text-[10px] font-medium text-slate-400">KAS TUNAI</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-xl p-1.5 md:p-2.5 text-center shadow-xs transition-colors">
              <div className="w-5 h-5 md:w-7 md:h-7 mx-auto rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-0.5">
                <QrCodeIcon className="w-4 h-4" />
              </div>
              <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight tabular-nums">Rp 1.000k</p>
              <p className="text-[9px] md:text-[10px] font-medium text-slate-400">QRIS</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-xl p-1.5 md:p-2.5 text-center shadow-xs transition-colors">
              <div className="w-5 h-5 md:w-7 md:h-7 mx-auto rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-0.5">
                <ReceiptPercentIcon className="w-4 h-4" />
              </div>
              <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight tabular-nums">24 Struk</p>
              <p className="text-[9px] md:text-[10px] font-medium text-slate-400">TOTAL</p>
            </div>
          </div>

          {/* Tombol Utama Transaksi Kasir */}
          <button 
            onClick={() => {
              navigator.vibrate?.(15);
              handleNav('/kasir');
            }}
            className="flex-none w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all duration-150 font-semibold !text-white text-xs md:text-sm py-2.5 md:py-3.5 rounded-xl shadow-sm shadow-orange-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span className="tracking-wide">+ TRANSAKSI BARU (KASIR)</span>
          </button>
        </section>

        {/* === KOLOM KANAN === */}
        <section className="flex-1 min-h-0 flex flex-col justify-between gap-2 md:col-span-7 lg:col-span-7 overflow-hidden">
          
          {/* Menu Utama (6 Grid) */}
          <div className="flex-none">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-[10px] md:text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wider">MENU UTAMA</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { name: 'Cek Harga', icon: MagnifyingGlassIcon, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60', link: '/products' },
                { name: 'Produk', icon: CubeIcon, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60', link: '/products' },
                { name: 'Laporan', icon: ChartBarIcon, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60', link: '/laporan' },
                { name: 'Biaya', icon: ReceiptRefundIcon, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60', link: '/expenses' },
                { name: 'Shift', icon: UserGroupIcon, color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60', link: '/shift' },
                { name: 'Riwayat', icon: ClockIcon, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60', link: '/transactions' },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleNav(item.link)}
                    className="bg-white dark:bg-slate-900 hover:bg-blue-50/70 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 dark:hover:border-blue-500/50 rounded-xl py-1.5 px-1 md:p-3 flex flex-col items-center justify-center gap-0.5 active:scale-95 active:border-blue-500 active:ring-2 active:ring-blue-500/25 active:shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all duration-200 shadow-xs cursor-pointer"
                  >
                    <div className={`p-1 rounded-lg ${item.color}`}>
                      <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <span className="text-[10px] md:text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aktivitas Terakhir */}
          <div className="flex-1 min-h-0 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-2.5 md:p-3 shadow-xs overflow-hidden transition-colors">
            <div className="flex-none flex justify-between items-center pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] md:text-xs font-semibold text-slate-700 dark:text-slate-200">AKTIVITAS TERAKHIR</span>
              </div>
              <button 
                onClick={() => handleNav('/transactions')}
                className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ChevronRightIcon className="w-3 h-3 ml-0.5" />
              </button>
            </div>
            
            <div className="pt-1 flex-1 min-h-0 flex flex-col justify-center">
              {recentTransactions.slice(0, 1).map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => {
                    navigator.vibrate?.(15);
                    setSelectedTransaction(tx);
                  }}
                  className="flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/70 hover:bg-blue-50/80 dark:hover:bg-slate-800 py-2 px-3 rounded-lg border border-slate-100 dark:border-slate-700/80 dark:hover:border-blue-500/50 active:scale-[0.98] active:border-blue-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${tx.paymentMethod === 'TUNAI' ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'}`}>
                      {tx.paymentMethod === 'TUNAI' ? <BanknotesIcon className="w-4 h-4" /> : <QrCodeIcon className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs leading-tight">{tx.code}</p>
                      <p className="text-[9px] text-slate-400">{tx.time} • {tx.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs leading-tight">Rp {tx.total.toLocaleString('id-ID')}</p>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${tx.status === 'SELESAI' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60' : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60'}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
};

export default DashboardPage;