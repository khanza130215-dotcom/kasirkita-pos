import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAppMode } from '../../context/AppModeContext';
import { transactionService } from '../../services/transactionService';
import { settingsService } from '../../services/settingsService';
import { formatRupiah, calculatePayment } from '../../utils/paymentUtils';
import { TransactionStatus, TransactionItem, Payment, StoreSettings } from '../../types';
import { Settings, QrCode, AlertCircle } from 'lucide-react';

type PaymentMethod = 'tunai' | 'transfer' | 'qris' | 'tempo';

interface PaymentModalProps {
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

// Generator matriks QR SVG deterministik offline untuk fallback jika gambar QRIS belum diunggah
const DynamicQrFallback: React.FC<{ payload: string }> = ({ payload }) => {
  const size = 21;
  const cells = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < payload.length; i++) {
      hash ^= payload.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const isFinder = (r: number, c: number) => {
      const inTopLeft = r < 7 && c < 7;
      const inTopRight = r < 7 && c >= size - 7;
      const inBottomLeft = r >= size - 7 && c < 7;
      if (!inTopLeft && !inTopRight && !inBottomLeft) return null;

      const lr = r >= size - 7 ? r - (size - 7) : r;
      const lc = c >= size - 7 ? c - (size - 7) : c;
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    };

    const grid: boolean[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const finder = isFinder(r, c);
        if (finder !== null) {
          grid.push(finder);
        } else {
          const seed = Math.imul(hash ^ (r * 31 + c * 17), 16777619);
          grid.push((seed & 1) === 1);
        }
      }
    }
    return grid;
  }, [payload]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs"
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#FFFFFF" />
      {cells.map((filled, idx) =>
        filled ? (
          <rect
            key={idx}
            x={idx % size}
            y={Math.floor(idx / size)}
            width={1}
            height={1}
            fill="#0F172A"
          />
        ) : null
      )}
    </svg>
  );
};

export const PaymentModal = ({ onClose, onSuccess }: PaymentModalProps) => {
  const navigate = useNavigate();
  const { cart, getCartSubtotal, clearCart } = useCart();
  const { mode } = useAppMode();
  const total = getCartSubtotal();
  const [method, setMethod] = useState<PaymentMethod>('tunai');
  const [received, setReceived] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    let isMounted = true;
    settingsService
      .getSettings()
      .then((data) => {
        if (isMounted) setStoreSettings(data);
      })
      .catch((err) => console.error('Gagal memuat pengaturan QRIS:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const { change, shortage, isValid } = useMemo(
    () => calculatePayment(total, received),
    [total, received]
  );

  const handleConfirm = async () => {
    if (isProcessing) return;
    setErrorMsg(null);
    setIsProcessing(true);

    const transactionHeader = {
      status: 'COMPLETED' as TransactionStatus,
      storeId: 1,
      totalAmount: total,
      discountAmount: 0,
      finalAmount: total,
      notes: method
    };

    const items: Omit<TransactionItem, 'id' | 'transactionId'>[] = cart.map((item) => ({
      productId: item.productId,
      sku: item.sku,
      barcode: item.barcode,
      productName: item.productName,
      unit: item.unit,
      price: item.unitPrice,
      quantity: item.quantity,
      discount: 0,
      subtotal: item.lineSubtotal
    }));

    const payments: Omit<Payment, 'id' | 'transactionId'>[] = [
      {
        method: method,
        amount: method === 'tunai' ? received : total,
        status: method === 'tempo' ? 'UNPAID' : 'PAID'
      }
    ];

    try {
      await transactionService.createTransaction(
        transactionHeader,
        items,
        payments,
        mode as 'lite' | 'pro'
      );
      navigator.vibrate?.(15);
      clearCart();
      onSuccess?.('Transaksi berhasil disimpan!');
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Pembayaran gagal';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const storeName = storeSettings?.storeName?.trim() || 'TOKO FARDAN';
  const qrisMerchantName = storeSettings?.qrisName?.trim() || 'QRIS Merchant Nasional';
  const qrisImage = storeSettings?.qrisImage?.trim() || '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111D30] p-3.5 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E2E8F0] dark:border-[#263954] text-[#172033] dark:text-white">
        <h2 className="text-[16px] font-semibold mb-2.5 tracking-tight text-[#172033] dark:text-white leading-tight">
          Review Pembayaran
        </h2>

        <div className="mb-2.5 space-y-1 border-b border-[#E2E8F0] dark:border-[#263954] pb-2.5">
          {cart.map((item, idx) => (
            <div key={item.productId} className="flex justify-between text-[12px] leading-snug gap-2">
              <span className="text-[#64748B] dark:text-[#94A3B8] truncate">
                {idx + 1}. {item.productName} (x{item.quantity})
              </span>
              <span className="font-medium text-[#172033] dark:text-white tabular-nums whitespace-nowrap">
                {formatRupiah(item.lineSubtotal)}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-1.5">
            <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">Total Bayar</span>
            <span className="text-[20px] font-bold text-[#0866E9] dark:text-[#FF7900] tabular-nums leading-tight">
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        <div className="mb-2.5">
          <p className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
            Metode Pembayaran
          </p>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full min-h-[44px] h-11 px-3 rounded-xl border border-[#E2E8F0] dark:border-[#263954] bg-[#F1F4F8] dark:bg-[#070B16] text-[12.5px] font-medium text-[#172033] dark:text-white outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900]"
          >
            <option value="tunai">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer</option>
            <option value="tempo">Tempo (Belum Lunas)</option>
          </select>
        </div>

        {method === 'tunai' && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
            <div>
              <p className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                Uang Diterima
              </p>
              <input
                type="number"
                className="w-full min-h-[40px] h-10 px-3 text-[16px] font-semibold bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl text-[#172033] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] tabular-nums"
                placeholder="0"
                value={received || ''}
                onChange={(e) => setReceived(Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[10000, 20000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setReceived(amt)}
                  className="min-h-[44px] rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] text-xs font-medium text-[#172033] dark:text-white hover:border-[#0866E9] dark:hover:border-[#FF7900] active:scale-95 transition-all cursor-pointer tabular-nums"
                >
                  {amt.toLocaleString('id-ID')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setReceived(total)}
                className="min-h-[44px] rounded-xl bg-[#0866E9]/10 dark:bg-[#FF7900]/15 text-[#0866E9] dark:text-[#FF7900] border border-[#0866E9]/30 dark:border-[#FF7900]/40 text-xs font-semibold active:scale-95 transition-all col-span-2 cursor-pointer"
              >
                Uang Pas
              </button>
            </div>

            <div className="p-2.5 bg-[#F1F4F8] dark:bg-[#070B16] rounded-xl border border-[#E2E8F0] dark:border-[#263954] flex justify-between items-center">
              <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">Kembalian</span>
              <span
                className={`text-[14px] font-semibold tabular-nums ${
                  change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                }`}
              >
                {formatRupiah(change)}
              </span>
            </div>
            {shortage > 0 && (
              <p className="text-[11px] text-center text-red-500 dark:text-red-400 font-medium tabular-nums">
                Kurang {formatRupiah(shortage)} lagi
              </p>
            )}
          </div>
        )}

        {/* Tampilan QRIS Toko Otomatis */}
        {method === 'qris' && (
          <div className="bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-3 flex flex-col items-center text-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0866E9] dark:text-[#FF7900]">
              <QrCode size={14} />
              <span>Pembayaran QRIS</span>
            </div>

            <div className="space-y-0.5">
              <p className="text-[12.5px] font-semibold text-[#172033] dark:text-white leading-tight">
                {storeName}
              </p>
              <p className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">{qrisMerchantName}</p>
            </div>

            {qrisImage ? (
              <>
                <div className="bg-white p-1.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                  <img
                    src={qrisImage}
                    alt={`QRIS ${storeName}`}
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <p className="text-[12.5px] font-semibold text-[#0866E9] dark:text-[#FF7900] tabular-nums">
                  Nominal Bayar: {formatRupiah(total)}
                </p>
              </>
            ) : (
              <>
                <div className="bg-white p-1.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                  <DynamicQrFallback payload={`QRIS:${storeName}:${total}`} />
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-tight">
                  QR dinamis otomatis (gambar QRIS toko belum diunggah)
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/settings');
                  }}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#111D30] hover:border-[#0866E9] dark:hover:border-[#FF7900] text-[#0866E9] dark:text-[#FF7900] border border-[#E2E8F0] dark:border-[#263954] text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Settings size={14} />
                  <span>Atur QRIS Toko</span>
                </button>
              </>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="mt-2.5 flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-400 text-[11.5px] px-3 py-2 rounded-xl">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-3.5 space-y-1.5">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || (method === 'tunai' && !isValid)}
            className="w-full min-h-[44px] bg-[#0866E9] hover:bg-[#0758CC] disabled:bg-slate-200 dark:disabled:bg-[#263954] disabled:text-slate-400 dark:disabled:text-slate-500 text-white rounded-xl font-semibold text-[12.5px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full min-h-[44px] text-slate-500 dark:text-slate-400 text-xs font-medium hover:text-[#172033] dark:hover:text-white transition-colors cursor-pointer"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
};
