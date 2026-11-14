import React, { useState, useEffect, useMemo } from 'react';
import { transactionService } from '../services/transactionService';
import { settingsService } from '../services/settingsService';
import { seedInitialData } from '../db/seedData';
import { TransactionWithDetails } from '../types';
import {
  ChevronRight,
  Download,
  FileText,
  MessageCircle,
  Printer,
  X,
} from 'lucide-react';
import { formatRupiah } from '../utils/paymentUtils';

type DatePreset = 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'all' | 'custom';

const toLocalDateInput = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseStartOfDay = (dateStr: string): number | null => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
};

const parseEndOfDay = (dateStr: string): number | null => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
};

export const ReportsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('SEMUA METODE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState<DatePreset>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(
    null
  );
  const [storeName, setStoreName] = useState<string>('TOKO FARDAN');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      await seedInitialData();
      const [all, settings] = await Promise.all([
        transactionService.getAllTransactions(),
        settingsService.getSettings(),
      ]);
      setTransactions(all);
      if (settings?.storeName?.trim()) {
        setStoreName(settings.storeName.trim());
      }
    };
    loadData();
  }, []);

  const applyPreset = (preset: DatePreset) => {
    const now = new Date();
    setActivePreset(preset);

    if (preset === 'today') {
      const today = toLocalDateInput(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7days') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      setStartDate(toLocalDateInput(start));
      setEndDate(toLocalDateInput(now));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toLocalDateInput(firstDay));
      setEndDate(toLocalDateInput(now));
    } else if (preset === 'lastMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(toLocalDateInput(firstDay));
      setEndDate(toLocalDateInput(lastDay));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const dateFiltered = useMemo(() => {
    const startMs = parseStartOfDay(startDate);
    const endMs = parseEndOfDay(endDate);

    return transactions.filter((t) => {
      const txTime = new Date(t.createdAt).getTime();
      if (startMs !== null && txTime < startMs) return false;
      if (endMs !== null && txTime > endMs) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const filtered = useMemo(() => {
    return dateFiltered.filter((t) => {
      if (selectedMethod === 'SEMUA METODE') return true;
      return (t.paymentMethod || 'TUNAI').toUpperCase() === selectedMethod;
    });
  }, [dateFiltered, selectedMethod]);

  const totalOmzet = useMemo(
    () => filtered.reduce((sum, t) => sum + (t.finalAmount || t.totalAmount || 0), 0),
    [filtered]
  );

  const totalQty = useMemo(
    () =>
      filtered.reduce(
        (sum, t) => sum + (t.items?.reduce((s: number, i) => s + (i.quantity || 0), 0) || 0),
        0
      ),
    [filtered]
  );

  const methodBreakdown = useMemo(() => {
    const totals = { TUNAI: 0, QRIS: 0, TRANSFER: 0 };
    for (const t of dateFiltered) {
      const method = (t.paymentMethod || 'TUNAI').toUpperCase();
      const amount = t.finalAmount || t.totalAmount || 0;
      if (method === 'QRIS') totals.QRIS += amount;
      else if (method === 'TRANSFER') totals.TRANSFER += amount;
      else totals.TUNAI += amount;
    }
    return totals;
  }, [dateFiltered]);

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      showToast('Tidak ada data transaksi pada rentang tanggal ini.');
      return;
    }

    const headers = [
      'No',
      'ID Struk',
      'Tanggal',
      'Waktu',
      'Metode Pembayaran',
      'Status',
      'Qty Item',
      'Total',
    ];

    const escapeCsv = (val: string | number) => {
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filtered.map((t, idx) => {
      const dt = new Date(t.createdAt);
      const tanggal = toLocalDateInput(dt);
      const waktu = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const invoiceId = t.id?.startsWith('TRX-') ? t.id : `TRX-${t.id || idx + 1000}`;
      const qty = t.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
      const total = t.finalAmount || t.totalAmount || 0;

      return [
        idx + 1,
        invoiceId,
        tanggal,
        waktu,
        (t.paymentMethod || 'TUNAI').toUpperCase(),
        t.status || 'COMPLETED',
        qty,
        total,
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const rangeLabel =
      startDate || endDate ? `${startDate || 'awal'}_sd_${endDate || 'akhir'}` : 'semua-periode';
    link.href = url;
    link.setAttribute('download', `laporan-penjualan-${rangeLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Rekap ${filtered.length} transaksi berhasil diunduh.`);
  };

  const buildReceiptText = (tx: TransactionWithDetails): string => {
    const dt = new Date(tx.createdAt);
    const tanggal = dt.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const waktu = dt.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const invoiceId = tx.id?.startsWith('TRX-')
      ? tx.id
      : `TRX-${tx.id?.slice(0, 6) || '1000'}`;
    const method = (tx.paymentMethod || 'TUNAI').toUpperCase();
    const total = tx.finalAmount || tx.totalAmount || 0;

    const itemLines =
      tx.items && tx.items.length > 0
        ? tx.items
            .map((item) => {
              const subtotal = item.subtotal || item.price * item.quantity;
              return `- ${item.productName}\n  ${item.quantity}x @ ${formatRupiah(item.price)} = ${formatRupiah(subtotal)}`;
            })
            .join('\n')
        : '- (Tidak ada rincian barang)';

    const lines = [
      `*${storeName.toUpperCase()}*`,
      `Struk Transaksi Digital`,
      `--------------------------------`,
      `No. Struk : ${invoiceId}`,
      `Tanggal   : ${tanggal}, ${waktu} WIB`,
      `Metode    : ${method}`,
      `--------------------------------`,
      `*Rincian Barang:*`,
      itemLines,
      `--------------------------------`,
    ];

    if (tx.discountAmount > 0) {
      lines.push(`Diskon    : -${formatRupiah(tx.discountAmount)}`);
    }

    lines.push(`*Total Pembayaran: ${formatRupiah(total)}*`);
    lines.push(`Terima kasih atas kunjungan Anda!`);

    return lines.join('\n');
  };

  const handleCopyForWhatsApp = async (tx: TransactionWithDetails) => {
    navigator.vibrate?.(15);
    const receiptText = buildReceiptText(tx);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(receiptText);
      }
    } catch (err) {
      console.error('Gagal menyalin struk ke clipboard:', err);
    }
    showToast('Salinan struk siap dikirim ke WhatsApp');
  };

  const activeDesktopTransaction = useMemo(() => {
    if (selectedTransaction && filtered.some((t) => t.id === selectedTransaction.id)) {
      return selectedTransaction;
    }
    return filtered[0] ?? null;
  }, [selectedTransaction, filtered]);

  const renderReceiptDetail = (tx: TransactionWithDetails, isMobileModal: boolean) => {
    const dt = new Date(tx.createdAt);
    const dateLabel = dt.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeLabel = dt.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const invoiceId = tx.id?.startsWith('TRX-')
      ? tx.id
      : `TRX-${tx.id?.slice(0, 6) || '1000'}`;
    const paymentMethod = (tx.paymentMethod || 'TUNAI').toUpperCase();
    const totalAmount = tx.finalAmount || tx.totalAmount || 0;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(buildReceiptText(tx))}`;

    return (
      <>
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0">
          <div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {storeName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100">
                {invoiceId}
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70">
                {tx.status === 'COMPLETED' ? 'SELESAI' : tx.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {dateLabel} • {timeLabel} WIB • {paymentMethod}
            </p>
          </div>
          {isMobileModal && (
            <button
              type="button"
              onClick={() => setSelectedTransaction(null)}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="Tutup detail transaksi"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Daftar Rincian Barang */}
        <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
            Rincian Barang
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-2.5 space-y-2 border border-slate-100 dark:border-slate-700/80 flex-1 min-h-0 max-h-48 md:max-h-none overflow-y-auto">
            {tx.items && tx.items.length > 0 ? (
              tx.items.map((item, idx) => {
                const subtotal = item.subtotal || item.price * item.quantity;
                return (
                  <div
                    key={item.id ?? idx}
                    className="flex justify-between items-start gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-slate-400 tabular-nums">
                        {item.quantity}x @ {formatRupiah(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums whitespace-nowrap">
                      {formatRupiah(subtotal)}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">
                Tidak ada rincian barang
              </p>
            )}
          </div>
        </div>

        {/* Ringkasan Pembayaran */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-1 shrink-0">
          {tx.discountAmount > 0 && (
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>Diskon</span>
              <span className="tabular-nums">-{formatRupiah(tx.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Pembayaran</span>
            <span className="text-sm md:text-base font-bold text-[#0866E9] dark:text-blue-400 tabular-nums">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        {/* Tombol Aksi: Cetak Ulang Struk & Kirim WA */}
        <div className="grid grid-cols-2 gap-2 pt-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              navigator.vibrate?.(15);
              showToast(`Struk ${invoiceId} dikirim ke printer thermal`);
              if (isMobileModal) setSelectedTransaction(null);
            }}
            className="bg-[#0866E9] hover:bg-blue-600 active:scale-[0.98] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Printer size={14} />
            <span>Cetak Ulang Struk</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleCopyForWhatsApp(tx)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <MessageCircle size={14} />
            <span>Kirim WA</span>
          </a>
        </div>
      </>
    );
  };

  const presets: { id: DatePreset; label: string }[] = [
    { id: 'today', label: 'Hari Ini' },
    { id: '7days', label: '7 Hari' },
    { id: 'thisMonth', label: 'Bulan Ini' },
    { id: 'lastMonth', label: 'Bulan Lalu' },
    { id: 'all', label: 'Semua' },
  ];

  const methods = ['SEMUA METODE', 'TUNAI', 'QRIS', 'TRANSFER'];

  return (
    <div className="h-full flex flex-col p-2.5 md:p-4 gap-1.5 md:gap-2.5 overflow-hidden select-none bg-slate-50 dark:bg-slate-950 relative transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs px-4 py-2 rounded-xl shadow-xl border border-slate-700/50 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Laporan Ringkas & Tombol Tarik Data (CSV) */}
      <div className="flex justify-between items-center shrink-0 pt-0.5">
        <div>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
            Laporan Penjualan
          </h1>
          <p className="text-[9px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
            REKAP LINTAS PERIODE
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-2.5 py-1.5 bg-[#0866E9] hover:bg-blue-600 text-white rounded-xl text-[10px] font-medium flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Download size={12} strokeWidth={2.5} />
          <span>Tarik Data (CSV)</span>
        </button>
      </div>

      {/* 2. Filter Rentang Tanggal Lintas Bulan (Dari & Sampai Tanggal) */}
      <div className="grid grid-cols-2 gap-1.5 shrink-0">
        <div className="flex flex-col gap-0.5">
          <label className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setActivePreset('custom');
            }}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-100 outline-none focus:border-blue-400 dark:focus:border-blue-500 w-full"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setActivePreset('custom');
            }}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-100 outline-none focus:border-blue-400 dark:focus:border-blue-500 w-full"
          />
        </div>
      </div>

      {/* 3. Baris Chip Filter Cepat */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {presets.map((p) => {
          const isActive = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-medium transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-[#0866E9] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 4. Ringkasan 4 Kartu Metrik Kompak */}
      <div className="grid grid-cols-4 gap-1 shrink-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-1.5 flex flex-col items-center justify-center shadow-2xs">
          <span className="text-[8px] font-medium text-slate-400 uppercase">QTY</span>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight tabular-nums">
            {totalQty}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/70 rounded-xl p-1.5 flex flex-col items-center justify-center shadow-2xs">
          <span className="text-[8px] font-medium text-[#0866E9] dark:text-blue-400 uppercase">OMZET</span>
          <span className="text-[10px] font-semibold text-[#0866E9] dark:text-blue-400 leading-tight truncate w-full text-center tabular-nums">
            {formatRupiah(totalOmzet)}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-1.5 flex flex-col items-center justify-center shadow-2xs">
          <span className="text-[8px] font-medium text-slate-400 uppercase">STRUK</span>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight tabular-nums">
            {filtered.length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/70 rounded-xl p-1.5 flex flex-col items-center justify-center shadow-2xs">
          <span className="text-[8px] font-medium text-emerald-600 dark:text-emerald-400 uppercase">BERSIH</span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight truncate w-full text-center tabular-nums">
            {formatRupiah(totalOmzet)}
          </span>
        </div>
      </div>

      {/* 5. Ringkasan & Filter Metode Pembayaran Real-Time */}
      <div className="grid grid-cols-3 gap-1 shrink-0">
        {(['TUNAI', 'QRIS', 'TRANSFER'] as const).map((method) => {
          const isSelected = selectedMethod === method;
          return (
            <button
              key={method}
              onClick={() => setSelectedMethod(isSelected ? 'SEMUA METODE' : method)}
              className={`rounded-xl px-2 py-1 border text-left transition-all active:scale-98 cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-500 ring-1 ring-blue-300 dark:ring-blue-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/50 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-semibold text-slate-500 dark:text-slate-400">{method}</span>
                {isSelected && (
                  <span className="text-[8px] font-semibold text-blue-600 dark:text-blue-400">AKTIF</span>
                )}
              </div>
              <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-100 truncate tabular-nums">
                {formatRupiah(methodBreakdown[method])}
              </div>
            </button>
          );
        })}
      </div>

      {/* 6. Split-View Konten Laporan (Mobile: Daftar Full-Width; Tablet/PC: 7 Kolom Kiri + 5 Kolom Kanan) */}
      <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-12 md:gap-4">
        {/* Tabel Daftar Transaksi (Kiri pada Tablet/PC) */}
        <div className="flex-1 min-h-0 md:col-span-7 md:h-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl md:rounded-2xl shadow-2xs flex flex-col overflow-hidden transition-colors">
          {/* Table Header + Filter Cepat Metode */}
          <div className="flex items-center justify-between px-2.5 py-1.5 md:px-3.5 md:py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 shrink-0">
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Daftar Struk ({filtered.length})
            </span>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="text-[9.5px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 outline-none"
            >
              {methods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Table Body */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-6 gap-1 opacity-50">
                <FileText className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                <p className="text-[9.5px] font-medium uppercase tracking-wider text-slate-400">
                  Tidak ada transaksi di rentang tanggal ini
                </p>
              </div>
            ) : (
              filtered.map((t, idx) => {
                const dt = new Date(t.createdAt);
                const dateLabel = dt.toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                const timeLabel = dt.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const invoiceId = t.id?.startsWith('TRX-')
                  ? t.id
                  : `TRX-${t.id?.slice(0, 6) || idx + 1000}`;
                const isActiveDesktop = activeDesktopTransaction?.id === t.id;

                return (
                  <button
                    type="button"
                    key={t.id || idx}
                    onClick={() => {
                      navigator.vibrate?.(15);
                      setSelectedTransaction(t);
                    }}
                    className={`w-full text-left flex items-center justify-between gap-2 px-2.5 py-2 md:px-3.5 md:py-2.5 transition-colors cursor-pointer ${
                      isActiveDesktop
                        ? 'hover:bg-blue-50/50 dark:hover:bg-slate-800/80 md:bg-blue-50/80 dark:md:bg-blue-950/40 md:border-l-4 md:border-l-[#0866E9]'
                        : 'hover:bg-blue-50/50 dark:hover:bg-slate-800/80 active:bg-blue-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {invoiceId}
                        </span>
                        <span className="text-[8.5px] font-medium px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#0866E9] dark:text-blue-400 border border-blue-200 dark:border-blue-800/70 shrink-0">
                          {(t.paymentMethod || 'TUNAI').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-400 mt-0.5 tabular-nums">
                        {dateLabel} • {timeLabel}
                      </p>
                    </div>
                    <div className="flex-none flex items-center gap-1 text-right">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                        {formatRupiah(t.finalAmount || t.totalAmount || 0)}
                      </span>
                      <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Rincian Struk Permanen (Khusus Tablet & PC md: ke atas) */}
        <div className="hidden md:flex md:col-span-5 md:h-full md:min-h-0 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs p-4 flex-col justify-between gap-3 overflow-hidden transition-colors">
          {activeDesktopTransaction ? (
            renderReceiptDetail(activeDesktopTransaction, false)
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-slate-400">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-medium uppercase tracking-wider">
                Pilih struk untuk melihat rincian
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 7. Bottom Sheet Detail Transaksi (Hanya untuk Mobile < md) */}
      {selectedTransaction && (
        <div
          onClick={() => setSelectedTransaction(null)}
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-4 shadow-2xl flex flex-col gap-3 max-h-[85dvh] overflow-y-auto"
          >
            {/* Drag handle mobile */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto shrink-0" />
            {renderReceiptDetail(selectedTransaction, true)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;