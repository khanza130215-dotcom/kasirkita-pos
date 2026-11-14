import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { productServices } from '../services/productServices';
import { settingsService } from '../services/settingsService';
import { seedInitialData } from '../db/seedData';
import { Product } from '../types';
import { BarcodeScannerModal } from '../components/scanner/BarcodeScannerModal';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ImportExportModal } from '../components/products/ImportExportModal';
import { Star, Search, Scan, Plus, FileUp, ChevronRight, X, Package, Tag, Barcode, Layers } from 'lucide-react';

export const AllProductsPage = () => {
  const products = useLiveQuery(() => db.products.toArray(), [], []) ?? [];
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const categories = useMemo(() => {
    const base = ['Semua', 'Umum', 'Makanan', 'Minuman', 'Sembako', 'Paket', 'Perlengkapan', 'Lainnya'];
    const extras = products
      .map(p => p.category)
      .filter((c): c is string => Boolean(c) && !base.includes(c));
    return [...base, ...Array.from(new Set(extras))];
  }, [products]);

  const loadProducts = async () => {
    await seedInitialData();
  };

  useEffect(() => {
    seedInitialData();
    settingsService.getFavorites().then(setFavorites);
  }, []);

  const toggleFavorite = async (productId: number) => {
    const updated = await settingsService.toggleFavorite(productId);
    setFavorites(updated);
  };

  const handleScan = async (barcode: string) => {
    setShowScanner(false);
    const found = await productServices.searchProducts(barcode);
    if (found.length > 0) {
      setSelectedProduct(found[0]);
    } else {
      setScannedBarcode(barcode);
      setShowForm(true);
    }
  };

  const filteredProducts = products.filter(p => 
    (selectedCategory === 'Semua' || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm) || p.sku.includes(searchTerm))
  );

  return (
    <div className="h-full flex flex-col overflow-hidden px-3 sm:px-4 pt-2 pb-2 gap-1.5 bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white relative transition-colors duration-200">
      {/* 1. Header Halaman Produk */}
      <div className="flex justify-between items-center gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">
            Daftar Produk
          </h1>
          <span className="text-[11px] font-medium text-[#0866E9] dark:text-[#FF7900] bg-white dark:bg-[#111D30] px-2 py-0.5 rounded-lg border border-[#E2E8F0] dark:border-[#263954] tabular-nums shrink-0">
            {filteredProducts.length} Item
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowImportExport(true)}
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] rounded-xl text-[#172033] dark:text-white hover:text-[#0866E9] dark:hover:text-[#FF7900] active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="Import / Export Data"
            aria-label="Import atau Export Data"
          >
            <FileUp size={17} />
          </button>
          <button
            type="button"
            onClick={() => { setScannedBarcode(''); setShowForm(true); }}
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center bg-[#0866E9] hover:bg-[#0758CC] text-white border border-transparent rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer"
            title="Tambah Produk Baru"
            aria-label="Tambah Produk Baru"
          >
            <Plus size={18} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {/* 2. Bar Pencarian & Scan Kamera */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex-1 min-w-0 min-h-[44px] h-11 flex items-center gap-2 bg-white dark:bg-[#111D30] px-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#263954] focus-within:border-[#0866E9] dark:focus-within:border-[#FF7900] shadow-2xs transition-colors">
          <Search size={16} className="text-[#0866E9] dark:text-[#FF7900] shrink-0" strokeWidth={2.25} />
          <input
            type="text"
            aria-label="Cari produk"
            className="w-full min-w-0 bg-transparent outline-none text-[12.5px] font-normal placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8] text-[#172033] dark:text-white"
            placeholder="Cari nama, barcode, atau SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] flex items-center justify-center text-[#0866E9] dark:text-[#FF7900] active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
          title="Scan Barcode Kamera"
          aria-label="Scan Barcode Kamera"
        >
          <Scan size={17} strokeWidth={2.25} />
        </button>
      </div>

      {/* 3. Bar Filter Kategori (Border & Active State Konsisten) */}
      <div className="flex gap-1.5 overflow-x-auto shrink-0 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {categories.map(c => {
          const isActive = selectedCategory === c;
          return (
            <button
              type="button"
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`whitespace-nowrap min-h-[44px] px-3 py-1.5 rounded-xl text-xs border transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-[#0866E9] dark:bg-[#FF7900] text-white border-transparent font-semibold shadow-2xs'
                  : 'bg-white dark:bg-[#111D30] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] hover:text-[#172033] dark:hover:text-white font-medium'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {showScanner && <BarcodeScannerModal onResult={handleScan} onClose={() => setShowScanner(false)} />}
      {showForm && (
        <ProductFormModal
          initialBarcode={scannedBarcode}
          onSave={async (p) => {
            await productServices.addProduct(p);
            setShowForm(false);
            await loadProducts();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
      {showImportExport && (
        <ImportExportModal
          onClose={() => setShowImportExport(false)}
          onRefresh={loadProducts}
        />
      )}

      {/* 4. Daftar Kartu Produk Ringkas (Scroll Internal) */}
      <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="grid grid-cols-1 gap-1.5 pb-1">
          {filteredProducts.length === 0 ? (
            <div className="p-6 text-center text-[#64748B] dark:text-[#94A3B8] text-[12.5px] bg-white dark:bg-[#111D30] rounded-xl border border-[#E2E8F0] dark:border-[#263954]">
              Tidak ada produk ditemukan
            </div>
          ) : (
            filteredProducts.map(p => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  navigator.vibrate?.(10);
                  setSelectedProduct(p);
                }}
                className="w-full min-h-[44px] text-left bg-white dark:bg-[#111D30] flex items-center justify-between gap-2.5 py-2 px-3 border border-[#E2E8F0] dark:border-[#263954] hover:border-[#0866E9] dark:hover:border-[#FF7900] rounded-xl shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
              >
                {/* Sisi Kiri: Nama Produk & Barcode */}
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium text-[#172033] dark:text-white truncate leading-tight">
                    {p.name}
                  </div>
                  <div className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8] font-mono truncate mt-0.5 leading-tight tabular-nums">
                    {p.barcode || p.sku || '-'} · Stok {p.openingStock}
                  </div>
                </div>

                {/* Sisi Kanan: Harga Jual & Panah Kanan */}
                <div className="flex-none flex items-center gap-1.5">
                  <span className="text-[12.5px] font-semibold text-[#0866E9] dark:text-[#FF7900] tabular-nums whitespace-nowrap">
                    Rp {p.sellingPrice.toLocaleString('id-ID')}
                  </span>
                  <ChevronRight size={15} className="text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#0866E9] dark:group-hover:text-[#FF7900] transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 5. Bottom Sheet / Modal Detail Produk */}
      {selectedProduct && (
        <div
          onClick={() => setSelectedProduct(null)}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full md:max-w-md bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-t-3xl md:rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5 max-h-[85dvh] overflow-y-auto animate-slide-up text-[#172033] dark:text-white"
          >
            {/* Drag handle untuk mobile */}
            <div className="w-10 h-1 bg-[#E2E8F0] dark:bg-[#263954] rounded-full mx-auto md:hidden" />

            {/* Header Detail */}
            <div className="flex items-start justify-between gap-2.5 border-b border-[#E2E8F0] dark:border-[#263954] pb-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-medium bg-[#0866E9]/10 dark:bg-[#0866E9]/20 text-[#0866E9] dark:text-blue-400 px-2 py-0.5 rounded-md border border-[#0866E9]/25 dark:border-[#0866E9]/40">
                    <Tag size={10} />
                    {selectedProduct.category || 'Umum'}
                  </span>
                  {selectedProduct.openingStock <= 0 ? (
                    <span className="text-[10.5px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 px-2 py-0.5 rounded-md">
                      Stok Habis
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 px-2 py-0.5 rounded-md tabular-nums">
                      Stok: {selectedProduct.openingStock} {selectedProduct.unit || 'Pcs'}
                    </span>
                  )}
                </div>
                <h2 className="text-[14px] font-semibold text-[#172033] dark:text-white leading-snug">
                  {selectedProduct.name}
                </h2>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {selectedProduct.id && (
                  <button
                    type="button"
                    onClick={() => toggleFavorite(selectedProduct.id!)}
                    className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                      favorites.includes(selectedProduct.id)
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/70 text-amber-500'
                        : 'bg-[#F1F4F8] dark:bg-[#070B16] border-[#E2E8F0] dark:border-[#263954] text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white'
                    }`}
                    title="Tandai Favorit"
                    aria-label="Tandai Favorit"
                  >
                    <Star size={16} fill={favorites.includes(selectedProduct.id) ? 'currentColor' : 'none'} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Tutup"
                  aria-label="Tutup detail produk"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Rincian Metadata Produk */}
            <div className="bg-[#F1F4F8] dark:bg-[#070B16] rounded-xl p-2.5 border border-[#E2E8F0] dark:border-[#263954] space-y-2">
              <div className="flex items-center justify-between text-[12px] min-h-[28px]">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium flex items-center gap-1.5">
                  <Barcode size={13} className="text-[#64748B] dark:text-[#94A3B8]" />
                  Barcode / SKU
                </span>
                <span className="font-mono font-medium text-[#172033] dark:text-white">
                  {selectedProduct.barcode || '-'} {selectedProduct.sku ? `(${selectedProduct.sku})` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between text-[12px] min-h-[28px]">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium flex items-center gap-1.5">
                  <Layers size={13} className="text-[#64748B] dark:text-[#94A3B8]" />
                  Kategori
                </span>
                <span className="font-medium text-[#172033] dark:text-white">
                  {selectedProduct.category || '-'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[12px] min-h-[28px]">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium flex items-center gap-1.5">
                  <Package size={13} className="text-[#64748B] dark:text-[#94A3B8]" />
                  Jumlah Stok
                </span>
                {selectedProduct.openingStock <= 0 ? (
                  <span className="text-[11px] font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-md">
                    Stok Habis (0)
                  </span>
                ) : (
                  <span className="font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {selectedProduct.openingStock} {selectedProduct.unit || 'Pcs'} tersedia
                  </span>
                )}
              </div>

              {selectedProduct.description && (
                <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#263954]">
                  <p className="text-[10.5px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-0.5">Deskripsi</p>
                  <p className="text-[12px] text-[#172033] dark:text-white leading-snug">{selectedProduct.description}</p>
                </div>
              )}
            </div>

            {/* Harga Jual Utama */}
            <div className="flex items-center justify-between bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-3 py-2.5">
              <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Harga Jual</span>
              <span className="text-[20px] font-bold text-[#0866E9] dark:text-[#FF7900] tabular-nums">
                Rp {selectedProduct.sellingPrice.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="w-full min-h-[44px] py-2 rounded-xl bg-[#0866E9] hover:bg-[#0758CC] active:scale-[0.98] text-white text-[12.5px] font-semibold transition-all cursor-pointer"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      )}
    </div>
  );
};