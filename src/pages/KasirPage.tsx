import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { productServices } from '../services/productServices';
import { settingsService } from '../services/settingsService';
import { shiftService } from '../services/shiftService';
import { seedInitialData } from '../db/seedData';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAppMode } from '../context/AppModeContext';
import { BarcodeScannerModal } from '../components/scanner/BarcodeScannerModal';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { PaymentModal } from '../components/payment/PaymentModal';
import {
  Search,
  Scan,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Wallet,
  Package,
  Zap,
  Unlock,
  Banknote,
  X,
} from 'lucide-react';
import { formatRupiah } from '../utils/paymentUtils';

const isSameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const KasirPage = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const products = useLiveQuery(() => db.products.toArray(), [], []) ?? [];
  const shiftQuery = useLiveQuery(
    async () => {
      const shift = await shiftService.getActiveShift();
      return { loaded: true, shift: shift ?? null };
    },
    [],
    { loaded: false, shift: null }
  );
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showScanner, setShowScanner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [initialCashInput, setInitialCashInput] = useState('200000');
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, getCartSubtotal, getTotalQuantity } = useCart();
  const { mode } = useAppMode();

  const hasTodayOpenShift = Boolean(
    shiftQuery.shift && isSameCalendarDay(new Date(shiftQuery.shift.openedAt), new Date())
  );
  const needsOpenShift = shiftQuery.loaded && !hasTodayOpenShift;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  useEffect(() => {
    const loadData = async () => {
      await seedInitialData();
      const favs = await settingsService.getFavorites();
      setFavorites(favs);
    };
    loadData();
  }, []);

  const handleQuickAddProduct = (product: Product, clearSearch = false) => {
    if (product.openingStock <= 0) {
      showToast(`Stok "${product.name}" sedang habis`);
      return;
    }
    navigator.vibrate?.(15);
    addToCart(product);
    if (clearSearch) {
      setSearchTerm('');
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const raw = searchTerm.trim();
    if (!raw) return;

    const normalized = raw.toLowerCase();
    const exactMatch = products.find(
      p =>
        p.barcode?.toLowerCase() === normalized ||
        p.sku?.toLowerCase() === normalized
    );

    if (exactMatch) {
      e.preventDefault();
      if (exactMatch.status === 'inactive') {
        showToast(`Produk "${exactMatch.name}" berstatus nonaktif`);
        return;
      }
      handleQuickAddProduct(exactMatch, true);
      showToast(`${exactMatch.name} masuk keranjang`);
    }
  };

  const handleOpenTodayShift = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setShiftError(null);
    const cleaned = initialCashInput.replace(/\D/g, '');
    if (!cleaned) {
      setShiftError('Masukkan nominal modal awal laci terlebih dahulu.');
      return;
    }
    const amount = Number(cleaned);
    setIsOpeningShift(true);
    try {
      // Tutup shift sisa hari sebelumnya secara otomatis bila masih terbuka
      if (shiftQuery.shift?.id && !hasTodayOpenShift) {
        await shiftService.closeShift(shiftQuery.shift.id);
      }
      await shiftService.openShift('Kasir Utama', amount);
      navigator.vibrate?.(15);
      showToast('Kasir hari ini berhasil dibuka');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } catch (err) {
      console.error('Gagal membuka shift kasir:', err);
      setShiftError(err instanceof Error ? err.message : 'Gagal membuka shift kasir.');
    } finally {
      setIsOpeningShift(false);
    }
  };

  const handleCheckoutClick = async () => {
    navigator.vibrate?.(15);
    const activeShift = await shiftService.getActiveShift();
    if (!activeShift || !isSameCalendarDay(new Date(activeShift.openedAt), new Date())) {
      showToast('Silakan buka shift kasir hari ini terlebih dahulu');
      return;
    }
    setShowPayment(true);
  };

  const handleScan = async (barcode: string) => {
    setShowScanner(false);
    const allProducts = await productServices.searchProducts(barcode);
    const product = allProducts.find(p => p.barcode === barcode);

    if (product) {
      if (product.status === 'inactive') {
        showToast('Produk ditemukan tetapi berstatus nonaktif');
      } else {
        handleQuickAddProduct(product, true);
      }
    } else {
      setScannedBarcode(barcode);
      setShowForm(true);
    }
  };

  const activeProducts = useMemo(
    () => products.filter(p => p.status === 'active'),
    [products]
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(activeProducts.map(p => p.category).filter(Boolean)));
    return ['Semua', ...unique];
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return activeProducts.filter(p =>
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.barcode.includes(query) ||
      p.sku.toLowerCase().includes(query)
    );
  }, [activeProducts, searchTerm]);

  const desktopCatalogProducts = useMemo(() => {
    if (selectedCategory === 'Semua') return filteredProducts;
    return filteredProducts.filter(p => p.category === selectedCategory);
  }, [filteredProducts, selectedCategory]);

  const quickProducts = useMemo(() => {
    const favList = activeProducts.filter(
      p => (p.id && favorites.includes(p.id)) || p.isFavorite
    );
    const extraBestSellers = activeProducts.filter(
      p => p.openingStock > 0 && !favList.some(f => f.id === p.id)
    );
    return [...favList, ...extraBestSellers].slice(0, 8);
  }, [activeProducts, favorites]);

  const totalItems = getTotalQuantity();
  const cartSubtotal = getCartSubtotal();

  return (
    <div className="h-full w-full flex flex-col md:grid md:grid-cols-12 md:gap-3 p-2.5 sm:p-3 overflow-hidden select-none bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white gap-2 relative transition-colors duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#172033] dark:bg-[#111D30] text-white text-xs px-3.5 py-2 rounded-xl shadow-xl border border-[#263954] flex items-center gap-2 max-w-[90vw]">
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Kolom Kiri (Tablet/PC: Daftar Produk + Pencarian; Mobile: Pencarian + Produk Cepat) */}
      <div className="flex flex-col gap-1.5 shrink-0 md:shrink md:col-span-7 md:min-h-0 md:h-full md:overflow-hidden relative min-w-0">
        {/* 1. Area Pencarian Produk & Scanner Barcode */}
        <div className="flex flex-col gap-1.5 shrink-0 relative">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0 min-h-[44px] h-11 flex items-center gap-2 bg-white dark:bg-[#111D30] px-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#263954] focus-within:border-[#0866E9] dark:focus-within:border-[#FF7900] shadow-2xs transition-colors">
              <Search
                className="w-4 h-4 text-[#0866E9] dark:text-[#FF7900] shrink-0"
                strokeWidth={2.25}
              />
              <input
                ref={searchInputRef}
                type="text"
                aria-label="Cari atau Scan Barang"
                className="w-full min-w-0 bg-transparent outline-none text-[12.5px] font-normal placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8] text-[#172033] dark:text-white"
                placeholder="Cari atau Scan Barang..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchTerm.length > 0 && (
                <button
                  type="button"
                  aria-label="Bersihkan pencarian"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 -mr-2 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#172033] dark:hover:text-white cursor-pointer shrink-0 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowScanner(true)}
              aria-label="Scan Barcode Kamera"
              title="Scan Barcode Kamera"
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] shadow-2xs flex items-center justify-center text-[#0866E9] dark:text-[#FF7900] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Scan className="w-[18px] h-[18px]" strokeWidth={2.25} />
            </button>
          </div>

          {/* Instant Search Dropdown Melayang */}
          {searchTerm.trim().length > 0 && (
            <div className="absolute top-12 left-0 right-0 z-30 bg-white dark:bg-[#111D30] rounded-xl border border-[#E2E8F0] dark:border-[#263954] shadow-xl overflow-hidden max-h-[250px] flex flex-col">
              <div className="px-3 py-1.5 border-b border-[#E2E8F0] dark:border-[#263954] bg-[#F1F4F8]/70 dark:bg-[#070B16]/60 flex justify-between items-center shrink-0">
                <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] tabular-nums">
                  Hasil Pencarian ({filteredProducts.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="min-h-[44px] px-2 text-xs font-medium text-[#0866E9] dark:text-[#FF7900] cursor-pointer flex items-center"
                >
                  Tutup
                </button>
              </div>
              <div className="overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#263954]">
                {filteredProducts.length === 0 ? (
                  <div className="p-3.5 text-center text-[12px] text-[#64748B] dark:text-[#94A3B8]">
                    Barang "{searchTerm}" tidak ditemukan
                  </div>
                ) : (
                  filteredProducts.map(p => {
                    const isOut = p.openingStock <= 0;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleQuickAddProduct(p, true)}
                        className={`w-full min-h-[44px] text-left px-3 py-2 flex justify-between items-center gap-2.5 transition-colors ${
                          isOut
                            ? 'bg-slate-50/70 dark:bg-[#070B16]/40 opacity-60 cursor-not-allowed'
                            : 'hover:bg-blue-50/60 dark:hover:bg-[#263954]/40 active:bg-blue-100/60 cursor-pointer'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[12.5px] text-[#172033] dark:text-white truncate leading-snug">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-[#64748B] dark:text-[#94A3B8]">
                            <span className="font-mono truncate">
                              {p.barcode || p.sku}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                isOut
                                  ? 'text-rose-600 dark:text-rose-400 font-medium'
                                  : 'text-emerald-600 dark:text-emerald-400 font-medium tabular-nums'
                              }
                            >
                              {isOut ? 'Stok Habis' : `Stok ${p.openingStock}`}
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-[12.5px] text-[#0866E9] dark:text-[#FF7900] tabular-nums whitespace-nowrap shrink-0">
                          {formatRupiah(p.sellingPrice)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 2. Baris Pintasan "Produk Cepat" (Horizontal Scroll 1x Tap) */}
          {quickProducts.length > 0 && (
            <div className="flex items-center overflow-x-auto gap-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <span className="shrink-0 inline-flex items-center gap-1 text-[10.5px] font-medium text-amber-600 dark:text-[#FF7900] pr-0.5">
                <Zap size={11} className="fill-current" />
                Cepat
              </span>
              {quickProducts.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleQuickAddProduct(p)}
                  className="shrink-0 min-h-[44px] flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl text-xs hover:border-[#0866E9] dark:hover:border-[#FF7900] active:scale-95 transition-all shadow-2xs cursor-pointer"
                >
                  <span className="font-medium text-[#172033] dark:text-white truncate max-w-[115px]">
                    {p.name}
                  </span>
                  <span className="font-semibold text-[#0866E9] dark:text-[#FF7900] tabular-nums whitespace-nowrap">
                    {formatRupiah(p.sellingPrice)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Katalog Produk Split-View (Khusus Tablet & PC md: ke atas) */}
        <div className="hidden md:flex md:flex-1 md:min-h-0 md:flex-col bg-white dark:bg-[#111D30] rounded-xl border border-[#E2E8F0] dark:border-[#263954] shadow-2xs overflow-hidden transition-colors">
          <div className="px-3 py-2 border-b border-[#E2E8F0] dark:border-[#263954] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-[13.5px] font-semibold text-[#172033] dark:text-white tracking-tight">
                Daftar Produk
              </h2>
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] tabular-nums">
                · {desktopCatalogProducts.length} item
              </span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[44px] px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0866E9] dark:bg-[#FF7900] text-white'
                      : 'bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-slate-300 border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2.5">
            {desktopCatalogProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-[#64748B] dark:text-[#94A3B8] py-8">
                <Package className="w-7 h-7 opacity-40" />
                <p className="text-xs font-medium">Produk tidak ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {desktopCatalogProducts.map(p => {
                  const isOutOfStock = p.openingStock <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => {
                        navigator.vibrate?.(15);
                        addToCart(p);
                      }}
                      className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5 min-h-[44px] ${
                        isOutOfStock
                          ? 'bg-slate-50 dark:bg-[#070B16]/50 border-[#E2E8F0] dark:border-[#263954] opacity-55 cursor-not-allowed'
                          : 'bg-white dark:bg-[#111D30] border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] active:scale-[0.98] shadow-2xs cursor-pointer'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5 text-[10.5px]">
                          <span className="font-mono text-[#64748B] dark:text-[#94A3B8] truncate">
                            {p.sku}
                          </span>
                          <span
                            className={
                              isOutOfStock
                                ? 'text-rose-600 dark:text-rose-400 font-medium'
                                : 'text-emerald-600 dark:text-emerald-400 font-medium tabular-nums'
                            }
                          >
                            {isOutOfStock ? 'Habis' : `Stok ${p.openingStock}`}
                          </span>
                        </div>
                        <h3 className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-snug line-clamp-2">
                          {p.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-[#E2E8F0] dark:border-[#263954]">
                        <span className="text-[12.5px] font-semibold text-[#0866E9] dark:text-[#FF7900] tabular-nums">
                          {formatRupiah(p.sellingPrice)}
                        </span>
                        <span className="w-6 h-6 rounded-md bg-[#F1F4F8] dark:bg-[#070B16] text-[#0866E9] dark:text-[#FF7900] flex items-center justify-center">
                          <Plus size={13} strokeWidth={2.5} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kolom Kanan (Tablet/PC: Keranjang Belanja + Ringkasan Bayar; Mobile: Flex-1 Bawah) */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col gap-2 md:col-span-5 md:h-full md:overflow-hidden">
        {/* 3. Daftar Keranjang */}
        <div className="flex-1 min-h-0 bg-white dark:bg-[#111D30] rounded-xl border border-[#E2E8F0] dark:border-[#263954] shadow-2xs flex flex-col overflow-hidden transition-colors">
          {/* Header Keranjang + Indikator Mode Kasir */}
          <div className="px-3 py-2 border-b border-[#E2E8F0] dark:border-[#263954] flex justify-between items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-[13.5px] font-semibold text-[#172033] dark:text-white tracking-tight truncate">
                Keranjang
              </h2>
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] tabular-nums whitespace-nowrap">
                · {totalItems} item
              </span>
            </div>

            <span
              data-testid="kasir-mode-indicator"
              className="text-[11px] font-medium text-[#0866E9] dark:text-[#FF7900] whitespace-nowrap shrink-0"
            >
              Mode: {mode === 'pro' ? 'Pro' : 'Lite'}
            </span>
          </div>

          {/* Daftar Barang dalam Keranjang */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#263954]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-1.5 px-4 py-6 text-center">
                <ShoppingCart
                  className="w-8 h-8 text-slate-300 dark:text-slate-600"
                  strokeWidth={1.6}
                />
                <p className="text-[12.5px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                  Belum ada barang di keranjang
                </p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.productId}
                  className="px-2.5 py-2 flex flex-col gap-1.5 bg-white dark:bg-[#111D30] transition-colors"
                >
                  {/* Baris Atas: Nama Barang, Harga Satuan, & Tombol Hapus */}
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-[12.5px] text-[#172033] dark:text-white leading-tight line-clamp-1">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal tabular-nums mt-0.5 leading-tight">
                        {formatRupiah(item.unitPrice)}
                        {item.unit ? ` / ${item.unit}` : ''}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      aria-label={`Hapus ${item.productName}`}
                      title={`Hapus ${item.productName}`}
                      className="min-w-[44px] min-h-[44px] w-11 h-11 -mr-1.5 -my-1.5 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 active:scale-95 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-[16px] h-[16px]" />
                    </button>
                  </div>

                  {/* Baris Bawah: Stepper Minus/Plus (min 44px) & Total Harga per Item */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.productId)}
                        aria-label={`Kurangi jumlah ${item.productName}`}
                        className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-l-xl flex items-center justify-center text-[#172033] dark:text-white hover:bg-white dark:hover:bg-[#111D30] active:scale-95 transition-all cursor-pointer"
                      >
                        <Minus size={15} strokeWidth={2.5} />
                      </button>

                      <span className="min-w-[28px] text-center font-semibold text-[12.5px] px-1 tabular-nums text-[#172033] dark:text-white">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.productId)}
                        aria-label={`Tambah jumlah ${item.productName}`}
                        className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-r-xl flex items-center justify-center text-[#0866E9] dark:text-[#FF7900] hover:bg-white dark:hover:bg-[#111D30] active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus size={15} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="text-right min-w-0">
                      <span className="block font-semibold text-[13px] text-[#172033] dark:text-white tabular-nums whitespace-nowrap">
                        {formatRupiah(item.lineSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Ringkasan dan Pembayaran */}
        <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-2.5 sm:p-3 shadow-2xs flex flex-col gap-2 shrink-0 transition-colors">
          <div className="flex justify-between items-baseline gap-2 px-0.5">
            <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
              Total Belanja
            </span>
            <span className="text-[20px] sm:text-[21px] font-bold text-[#172033] dark:text-white leading-none tracking-tight tabular-nums">
              {formatRupiah(cartSubtotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
            className="w-full min-h-[44px] h-11 px-4 rounded-xl bg-[#0866E9] hover:bg-[#0758CC] text-white font-semibold text-[12.5px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
          >
            <Wallet className="w-[17px] h-[17px] shrink-0" />
            <span>Bayar Sekarang</span>
          </button>
        </div>
      </div>

      {/* Overlay / Kartu Inline Buka Kasir Hari Ini (Otomatis Muncul Bila Shift Belum Buka / Hari Baru) */}
      {needsOpenShift && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/45 dark:bg-black/70 backdrop-blur-xs p-3">
          <form
            onSubmit={handleOpenTodayShift}
            className="w-full max-w-sm bg-white dark:bg-[#111D30] rounded-2xl p-3.5 shadow-2xl border border-[#E2E8F0] dark:border-[#263954] flex flex-col gap-2.5"
          >
            <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] dark:border-[#263954] pb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-[#0866E9]/15 text-[#0866E9] dark:text-[#FF7900] border border-[#E2E8F0] dark:border-[#263954] flex items-center justify-center shrink-0">
                <Unlock size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-semibold text-[#172033] dark:text-white leading-tight">
                  Buka Kasir Hari Ini
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-snug">
                  {shiftQuery.shift
                    ? 'Pergantian hari terdeteksi. Buka kasir baru untuk transaksi hari ini.'
                    : 'Masukkan nominal modal awal laci untuk mulai melayani transaksi.'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] block">
                Nominal Modal Awal Laci (Rp)
              </label>
              <div className="min-h-[40px] h-10 flex items-center gap-2 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-2.5 py-1.5 focus-within:border-[#0866E9] dark:focus-within:border-[#FF7900] transition-all">
                <Banknote className="w-4 h-4 text-[#0866E9] dark:text-[#FF7900] shrink-0" />
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Rp</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={initialCashInput}
                  onChange={(e) => {
                    setShiftError(null);
                    setInitialCashInput(e.target.value);
                  }}
                  placeholder="200000"
                  className="w-full bg-transparent text-[13px] font-semibold text-[#172033] dark:text-white outline-none tabular-nums"
                  autoFocus
                />
              </div>

              {/* Preset Cepat Modal Awal */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {[
                  { value: '100000', label: 'Rp 100.000' },
                  { value: '200000', label: 'Rp 200.000' },
                  { value: '500000', label: 'Rp 500.000' }
                ].map((preset) => {
                  const isSelected = initialCashInput.replace(/\D/g, '') === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        navigator.vibrate?.(10);
                        setShiftError(null);
                        setInitialCashInput(preset.value);
                      }}
                      className={`min-h-[44px] py-1.5 px-2 rounded-xl border text-[11px] font-medium tabular-nums transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-[#FF7900]/15 border-[#0866E9] dark:border-[#FF7900] text-[#0866E9] dark:text-[#FF7900]'
                          : 'bg-white dark:bg-[#070B16] border-[#E2E8F0] dark:border-[#263954] text-[#172033] dark:text-slate-300 hover:border-[#0866E9] dark:hover:border-[#FF7900]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {shiftError && (
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 rounded-xl px-2.5 py-1.5">
                {shiftError}
              </p>
            )}

            <button
              type="submit"
              disabled={isOpeningShift}
              className="w-full min-h-[44px] py-2 px-4 rounded-xl bg-[#0866E9] hover:bg-[#0758CC] text-white text-[12.5px] font-semibold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Unlock size={15} />
              <span>{isOpeningShift ? 'Membuka Kasir...' : 'Mulai Buka Kasir'}</span>
            </button>
          </form>
        </div>
      )}

      {showScanner && <BarcodeScannerModal onResult={handleScan} onClose={() => setShowScanner(false)} />}
      {showForm && (
        <ProductFormModal
          initialBarcode={scannedBarcode}
          onSave={async (p) => {
            await productServices.addProduct(p);
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      )}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}
    </div>
  );
};

export default KasirPage;