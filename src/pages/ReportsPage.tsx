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
        <div className="flex justify-between items-start border-b border-[#E2E8F0] dark:border-[#263954] pb-2.5 shrink-0">
          <div>
            <p className="text-[10.5px] font-medium text-[#64748B] dark:text-[#94A3B8]">
              {storeName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <h3 className="text-[14px] font-semibold text-[#172033] dark:text-white">
                {invoiceId}
              </h3>
              <span className="text-[10.5px] px-1.5 py-0.5 rounded-md font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70">
                {tx.status === 'COMPLETED' ? 'Selesai' : tx.status}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 tabular-nums">
              {dateLabel} · {timeLabel} WIB · {paymentMethod}
            </p>
          </div>
          {isMobileModal && (
            <button
              type="button"
              onClick={() => setSelectedTransaction(null)}
              className="min-w-[44px] min-h-[44px] w-11 h-11 -mr-1.5 -mt-1.5 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup detail transaksi"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Daftar Rincian Barang */}
        <div className="space-y-1 flex-1 min-h-0 flex flex-col">
          <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] shrink-0">
            Rincian Barang
          </p>
          <div className="bg-[#F1F4F8] dark:bg-[#070B16] rounded-xl p-2.5 space-y-1.5 border border-[#E2E8F0] dark:border-[#263954] flex-1 min-h-0 max-h-44 md:max-h-none overflow-y-auto">
            {tx.items && tx.items.length > 0 ? (
              tx.items.map((item, idx) => {
                const subtotal = item.subtotal || item.price * item.quantity;
                return (
                  <div
                    key={item.id ?? idx}
                    className="flex justify-between items-start gap-2 text-[12px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#172033] dark:text-white truncate">
                        {item.productName}
                      </p>
                      <p className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8] tabular-nums">
                        {item.quantity}x @ {formatRupiah(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-[#172033] dark:text-white tabular-nums whitespace-nowrap">
                      {formatRupiah(subtotal)}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8] text-center py-2">
                Tidak ada rincian barang
              </p>
            )}
          </div>
        </div>

        {/* Ringkasan Pembayaran */}
        <div className="border-t border-[#E2E8F0] dark:border-[#263954] pt-2 space-y-1 shrink-0">
          {tx.discountAmount > 0 && (
            <div className="flex justify-between items-center text-[12px] text-[#64748B] dark:text-[#94A3B8]">
              <span>Diskon</span>
              <span className="tabular-nums">-{formatRupiah(tx.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">Total Pembayaran</span>
            <span className="text-[20px] font-bold text-[#0866E9] dark:text-[#FF7900] tabular-nums">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        {/* Tombol Aksi: Cetak Ulang Struk & Kirim WA */}
        <div className="grid grid-cols-2 gap-2 pt-0.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              navigator.vibrate?.(15);
              showToast(`Struk ${invoiceId} dikirim ke printer thermal`);
              if (isMobileModal) setSelectedTransaction(null);
            }}
            className="min-h-[44px] bg-[#0866E9] hover:bg-[#0758CC] active:scale-[0.98] text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Printer size={14} />
            <span>Cetak Ulang Struk</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleCopyForWhatsApp(tx)}
            className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
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
    <div className="h-full flex flex-col px-3 py-2 sm:p-3.5 gap-1.5 overflow-hidden select-none bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white relative transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#172033] dark:bg-[#111D30] text-white text-xs px-3.5 py-2 rounded-xl shadow-xl border border-[#263954] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Laporan Ringkas & Tombol Tarik Data (CSV) */}
      <div className="flex justify-between items-center gap-2 shrink-0">
        <div className="min-w-0">
          <h1 className="text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">
            Laporan Penjualan
          </h1>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 leading-tight truncate">
            Rekap transaksi lintas periode
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="min-h-[44px] px-3 py-1.5 bg-[#0866E9] hover:bg-[#0758CC] text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Download size={14} strokeWidth={2.25} />
          <span>Tarik CSV</span>
        </button>
      </div>

      {/* 2. Filter Rentang Tanggal Lintas Bulan */}
      <div className="grid grid-cols-2 gap-1.5 shrink-0">
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] px-0.5 leading-tight">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setActivePreset('custom');
            }}
            className="min-h-[44px] h-11 text-[12px] bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-2 py-1 font-medium text-[#172033] dark:text-white outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] w-full"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] px-0.5 leading-tight">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setActivePreset('custom');
            }}
            className="min-h-[44px] h-11 text-[12px] bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-2 py-1 font-medium text-[#172033] dark:text-white outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] w-full"
          />
        </div>
      </div>

      {/* 3. Baris Chip Filter Cepat (5 Periode Pas 1 Baris) */}
      <div className="grid grid-cols-5 gap-1 shrink-0">
        {presets.map((p) => {
          const isActive = activePreset === p.id;
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`min-h-[44px] px-0.5 sm:px-1.5 py-1 rounded-xl text-[10.5px] sm:text-[11px] tracking-tight sm:tracking-normal border transition-all active:scale-95 cursor-pointer whitespace-nowrap text-center ${
                isActive
                  ? 'bg-[#0866E9] dark:bg-[#FF7900] text-white border-transparent font-semibold shadow-2xs'
                  : 'bg-white dark:bg-[#111D30] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] font-medium'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 4. Ringkasan 4 Metrik Padat dalam 1 Kartu Terstruktur */}
      <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl grid grid-cols-2 sm:grid-cols-4 overflow-hidden shadow-2xs shrink-0">
        <div className="px-2.5 py-1.5 border-b sm:border-b-0 border-r border-[#E2E8F0] dark:border-[#263954] flex flex-col justify-center">
          <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] leading-tight">Qty Item</span>
          <span className="text-[13px] font-semibold text-[#172033] dark:text-white leading-tight tabular-nums mt-0.5">
            {totalQty}
          </span>
        </div>
        <div className="px-2.5 py-1.5 border-b sm:border-b-0 sm:border-r border-[#E2E8F0] dark:border-[#263954] flex flex-col justify-center">
          <span className="text-[11px] font-medium text-[#0866E9] dark:text-[#FF7900] leading-tight">Total Omzet</span>
          <span className="text-[13px] font-semibold text-[#0866E9] dark:text-[#FF7900] leading-tight truncate w-full tabular-nums mt-0.5">
            {formatRupiah(totalOmzet)}
          </span>
        </div>
        <div className="px-2.5 py-1.5 border-r border-[#E2E8F0] dark:border-[#263954] flex flex-col justify-center">
          <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] leading-tight">Jumlah Struk</span>
          <span className="text-[13px] font-semibold text-[#172033] dark:text-white leading-tight tabular-nums mt-0.5">
            {filtered.length}
          </span>
        </div>
        <div className="px-2.5 py-1.5 flex flex-col justify-center">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 leading-tight">Pendapatan Bersih</span>
          <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight truncate w-full tabular-nums mt-0.5">
            {formatRupiah(totalOmzet)}
          </span>
        </div>
      </div>

      {/* 5. Ringkasan & Filter Metode Pembayaran Real-Time */}
      <div className="grid grid-cols-3 gap-1.5 shrink-0">
        {(['TUNAI', 'QRIS', 'TRANSFER'] as const).map((method) => {
          const isSelected = selectedMethod === method;
          return (
            <button
              type="button"
              key={method}
              onClick={() => setSelectedMethod(isSelected ? 'SEMUA METODE' : method)}
              className={`min-h-[44px] rounded-xl px-2 py-1 border text-left transition-all active:scale-98 cursor-pointer min-w-0 flex flex-col justify-center ${
                isSelected
                  ? 'bg-[#0866E9]/8 dark:bg-[#FF7900]/12 border-[#0866E9] dark:border-[#FF7900]'
                  : 'bg-white dark:bg-[#111D30] border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] leading-tight">{method}</span>
                {isSelected && (
                  <span className="text-[10px] font-semibold text-[#0866E9] dark:text-[#FF7900]">Aktif</span>
                )}
              </div>
              <div className="text-[12px] font-semibold text-[#172033] dark:text-white truncate tabular-nums mt-0.5 leading-tight">
                {formatRupiah(methodBreakdown[method])}
              </div>
            </button>
          );
        })}
      </div>

      {/* 6. Split-View Konten Laporan (Scroll Internal pada Daftar Struk) */}
      <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-12 md:gap-3 overflow-hidden">
        {/* Tabel Daftar Transaksi (Kiri pada Tablet/PC) */}
        <div className="flex-1 min-h-0 md:col-span-7 md:h-full bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl shadow-2xs flex flex-col overflow-hidden transition-colors">
          {/* Table Header + Filter Cepat Metode */}
          <div className="flex items-center justify-between px-2.5 py-1 border-b border-[#E2E8F0] dark:border-[#263954] bg-[#F1F4F8]/60 dark:bg-[#070B16]/50 shrink-0 gap-2">
            <span className="text-[13px] font-semibold text-[#172033] dark:text-white">
              Daftar Struk ({filtered.length})
            </span>
            <select
              aria-label="Filter metode pembayaran"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="min-h-[44px] text-[11px] font-medium text-[#172033] dark:text-white bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-lg px-2 py-1 outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900]"
            >
              {methods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Table Body (Area Scroll Internal) */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#263954] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-6 gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                <FileText className="w-6 h-6 opacity-50" />
                <p className="text-[12px] font-medium">
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
                    className={`w-full min-h-[44px] text-left flex items-center justify-between gap-2 px-3 py-2 transition-colors cursor-pointer ${
                      isActiveDesktop
                        ? 'hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40 md:bg-[#0866E9]/8 dark:md:bg-[#FF7900]/12'
                        : 'hover:bg-[#F1F4F8] dark:hover:bg-[#263954]/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[12.5px] text-[#172033] dark:text-white truncate leading-tight">
                          {invoiceId}
                        </span>
                        <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-md bg-[#F1F4F8] dark:bg-[#070B16] text-[#0866E9] dark:text-[#FF7900] border border-[#E2E8F0] dark:border-[#263954] shrink-0 leading-none">
                          {(t.paymentMethod || 'TUNAI').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 tabular-nums leading-tight">
                        {dateLabel} · {timeLabel}
                      </p>
                    </div>
                    <div className="flex-none flex items-center gap-1 text-right">
                      <span className="font-semibold text-[12.5px] text-[#172033] dark:text-white tabular-nums whitespace-nowrap">
                        {formatRupiah(t.finalAmount || t.totalAmount || 0)}
                      </span>
                      <ChevronRight size={14} className="text-[#64748B] dark:text-[#94A3B8]" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Rincian Struk Permanen (Khusus Tablet & PC md: ke atas) */}
        <div className="hidden md:flex md:col-span-5 md:h-full md:min-h-0 bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl shadow-2xs p-3 flex-col justify-between gap-2.5 overflow-hidden transition-colors">
          {activeDesktopTransaction ? (
            renderReceiptDetail(activeDesktopTransaction, false)
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
              <FileText className="w-7 h-7 opacity-50" />
              <p className="text-xs font-medium">
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
            className="w-full bg-white dark:bg-[#111D30] border-t border-[#E2E8F0] dark:border-[#263954] rounded-t-3xl p-3.5 shadow-2xl flex flex-col gap-2.5 max-h-[85dvh] overflow-y-auto"
          >
            {/* Drag handle mobile */}
            <div className="w-10 h-1 bg-[#E2E8F0] dark:bg-[#263954] rounded-full mx-auto shrink-0" />
            {renderReceiptDetail(selectedTransaction, true)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;