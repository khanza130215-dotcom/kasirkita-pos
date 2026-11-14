import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { productServices } from '../services/productServices';
import { settingsService } from '../services/settingsService';
import { shiftService } from '../services/shiftService';
import { seedInitialData } from '../db/seedData';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { BarcodeScannerModal } from '../components/scanner/BarcodeScannerModal';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { PaymentModal } from '../components/payment/PaymentModal';
import { Search, Scan, Plus, Minus, Trash2, ShoppingCart, ArrowRight, Package, Zap, Unlock, Banknote } from 'lucide-react';
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
  const { cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, getCartSubtotal } = useCart();

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

  return (
    <div className="h-full flex flex-col md:grid md:grid-cols-12 md:gap-4 p-2.5 md:p-4 overflow-hidden select-none bg-slate-50 dark:bg-slate-950 gap-2 relative transition-colors duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs px-4 py-2 rounded-xl shadow-xl border border-slate-700/50 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Kolom Kiri (Tablet/PC: Daftar Produk + Pencarian; Mobile: Pencarian + Produk Cepat) */}
      <div className="flex flex-col gap-1.5 shrink-0 md:shrink md:col-span-7 md:min-h-0 md:h-full md:overflow-hidden relative">
        {/* 1. Bar Pencarian, Instant Dropdown & Scan Barcode */}
        <div className="flex flex-col gap-1 shrink-0 relative">
          <div className="flex items-center gap-1.5">
            <div className="flex-grow flex items-center gap-2 bg-white dark:bg-slate-900 px-2.5 py-1.5 md:py-2 rounded-xl border border-blue-400 dark:border-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.15)] transition-all">
              <Search className="w-3.5 h-3.5 text-[#0866E9] dark:text-blue-400 shrink-0" strokeWidth={2.5} />
              <input
                ref={searchInputRef}
                className="w-full bg-transparent outline-none text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 tracking-wide"
                placeholder="CARI NAMA ATAU SCAN BARCODE (ENTER)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchTerm.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setShowScanner(true)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.18)] flex items-center justify-center text-[#0866E9] dark:text-blue-400 active:scale-95 transition-all cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 shrink-0"
              title="Scan Kamera"
            >
              <Scan className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Instant Search Dropdown Melayang */}
          {searchTerm.trim().length > 0 && (
            <div className="absolute top-10 md:top-11 left-0 right-0 z-30 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-slate-700 shadow-xl overflow-hidden max-h-[240px] flex flex-col">
              <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center shrink-0">
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Hasil Pencarian ({filteredProducts.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="text-[9px] font-semibold text-[#0866E9] dark:text-blue-400 cursor-pointer"
                >
                  TUTUP
                </button>
              </div>
              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-center text-[11px] text-slate-400">
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
                        className={`w-full text-left px-2.5 py-2 flex justify-between items-center gap-2 transition-colors ${
                          isOut
                            ? 'bg-slate-50/70 dark:bg-slate-900/60 opacity-60 cursor-not-allowed'
                            : 'hover:bg-blue-50 dark:hover:bg-slate-800/80 active:bg-blue-100/60 cursor-pointer'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate leading-snug">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9.5px] font-mono text-slate-400 truncate">
                              {p.barcode || p.sku}
                            </span>
                            <span
                              className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${
                                isOut
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {isOut ? 'Stok Habis' : `Stok: ${p.openingStock}`}
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-xs text-[#0866E9] dark:text-blue-400 tabular-nums whitespace-nowrap shrink-0">
                          {formatRupiah(p.sellingPrice)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 2. Baris Chip "Produk Cepat" (Horizontal Scroll 1x Tap) */}
          {quickProducts.length > 0 && (
            <div className="flex items-center overflow-x-auto gap-1.5 no-scrollbar py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/70 px-1.5 py-1 rounded-lg">
                <Zap size={10} className="fill-amber-500 text-amber-500" />
                Cepat
              </span>
              {quickProducts.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleQuickAddProduct(p)}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] hover:border-blue-400 dark:hover:border-blue-500/50 dark:hover:bg-slate-800/80 active:scale-95 transition-all shadow-2xs cursor-pointer"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[115px]">
                    {p.name}
                  </span>
                  <span className="font-semibold text-[#0866E9] dark:text-blue-400 tabular-nums whitespace-nowrap">
                    {formatRupiah(p.sellingPrice)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Katalog Produk Split-View (Khusus Tablet & PC md: ke atas) */}
        <div className="hidden md:flex md:flex-1 md:min-h-0 md:flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                Daftar Produk
              </h2>
              <span className="bg-blue-50 dark:bg-blue-950/60 text-[#0866E9] dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70 px-2 py-0.5 rounded-full text-[10px] font-medium tabular-nums">
                {desktopCatalogProducts.length} Item
              </span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0866E9] text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 custom-scrollbar">
            {desktopCatalogProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 py-10">
                <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium uppercase tracking-wider">Produk tidak ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
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
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                        isOutOfStock
                          ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-55 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-slate-800/80 active:scale-[0.98] shadow-2xs cursor-pointer'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-mono text-slate-400 truncate">
                            {p.sku}
                          </span>
                          <span
                            className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                              isOutOfStock
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {isOutOfStock ? 'Habis' : `Stok ${p.openingStock}`}
                          </span>
                        </div>
                        <h3 className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                          {p.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-[#0866E9] dark:text-blue-400 tabular-nums">
                          {formatRupiah(p.sellingPrice)}
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0866E9] dark:text-blue-400 flex items-center justify-center">
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

      {/* Kolom Kanan (Tablet/PC: Keranjang Belanja + Tombol Bayar Permanen; Mobile: Flex-1 Bawah) */}
      <div className="flex-1 min-h-0 flex flex-col gap-2 md:col-span-5 md:h-full md:overflow-hidden">
        {/* 2. Kartu Ringkas Belanja */}
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col overflow-hidden transition-colors">
          {/* Header Bar Ringkasan */}
          <div className="px-3 py-2 md:px-3.5 md:py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
            <h2 className="text-[10.5px] md:text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              RINGKASAN BELANJA
            </h2>
            <span className="bg-blue-50 dark:bg-blue-950/60 text-[#0866E9] dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70 px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-semibold tracking-wide tabular-nums">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} ITEM
            </span>
          </div>

          {/* Area Daftar Barang Masuk (Tersusun Vertikal ke Bawah) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 md:p-2.5 flex flex-col gap-1.5 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-1.5 opacity-40 py-8">
                <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-600" strokeWidth={1.8} />
                <p className="text-[9.5px] font-medium uppercase tracking-wider text-slate-400">
                  Keranjang Masih Kosong
                </p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.productId}
                  className="flex justify-between items-center p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <h4 className="font-medium text-xs text-slate-900 dark:text-slate-100 leading-tight truncate">
                      {item.productName}
                    </h4>
                    <span className="text-[9.5px] text-slate-400 font-medium tabular-nums mt-0.5">
                      {formatRupiah(item.unitPrice)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => decreaseQuantity(item.productId)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 font-bold cursor-pointer"
                      >
                        <Minus size={10} strokeWidth={3} />
                      </button>
                      <span className="font-semibold text-xs px-1.5 tabular-nums text-slate-900 dark:text-slate-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item.productId)}
                        className="w-5 h-5 flex items-center justify-center text-[#0866E9] dark:text-blue-400 active:scale-90 font-bold cursor-pointer"
                      >
                        <Plus size={10} strokeWidth={3} />
                      </button>
                    </div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 tabular-nums min-w-[60px] text-right">
                      {formatRupiah(item.lineSubtotal)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 p-1 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Footer Pembayaran Terkunci di Bawah */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl md:rounded-2xl p-2.5 md:p-3.5 shadow-xs flex flex-col gap-2 shrink-0 transition-colors">
          <div className="flex justify-between items-center px-1">
            <span className="text-[9.5px] md:text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              TOTAL BELANJA
            </span>
            <span className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight tabular-nums">
              {formatRupiah(getCartSubtotal())}
            </span>
          </div>

          <button
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
            className="w-full py-2.5 md:py-3 rounded-full bg-[#FF7900] hover:bg-orange-500 shadow-sm shadow-orange-500/20 text-black font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>BAYAR SEKARANG</span>
            <ArrowRight className="w-3.5 h-3.5 text-black" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Overlay / Kartu Inline Buka Kasir Hari Ini (Otomatis Muncul Bila Shift Belum Buka / Hari Baru) */}
      {needsOpenShift && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/45 dark:bg-black/70 backdrop-blur-xs p-3 md:p-4">
          <form
            onSubmit={handleOpenTodayShift}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0866E9] dark:text-blue-400 border border-blue-200 dark:border-blue-800/70 flex items-center justify-center shrink-0">
                <Unlock size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  Buka Kasir Hari Ini
                </h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {shiftQuery.shift
                    ? 'Pergantian hari terdeteksi. Buka kasir baru untuk transaksi hari ini.'
                    : 'Masukkan nominal modal awal laci untuk mulai melayani transaksi.'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Nominal Modal Awal Laci (Rp)
              </label>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
                <Banknote className="w-4 h-4 text-[#0866E9] dark:text-blue-400 shrink-0" />
                <span className="text-xs font-medium text-slate-400">Rp</span>
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
                  className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-slate-100 outline-none tabular-nums"
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
                      className={`py-1.5 px-2 rounded-lg border text-[10.5px] font-medium tabular-nums transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-[#0866E9] dark:text-blue-400 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500/50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {shiftError && (
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 rounded-xl px-3 py-1.5">
                {shiftError}
              </p>
            )}

            <button
              type="submit"
              disabled={isOpeningShift}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0866E9] hover:bg-blue-600 text-white text-xs font-semibold uppercase tracking-wider shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Unlock size={14} />
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