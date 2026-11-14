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
    <div className="h-full overflow-y-auto pb-4 px-3.5 pt-2.5 space-y-2.5 bg-slate-50 dark:bg-slate-950 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-colors duration-200">
      {/* 1. Header Ringkas Presisi Mobile */}
      <div className="flex justify-between items-center pt-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Daftar Produk</h1>
          <span className="text-[10px] font-medium text-[#0866E9] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/70">
            {filteredProducts.length} Item
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setShowImportExport(true)} 
            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#0866E9] dark:hover:text-blue-400 active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="Import / Export Data"
          >
            <FileUp size={15} />
          </button>
          <button 
            onClick={() => { setScannedBarcode(''); setShowForm(true); }} 
            className="w-8 h-8 flex items-center justify-center bg-[#0866E9] hover:bg-blue-600 text-white rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer"
            title="Tambah Produk Baru"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 2. Bar Pencarian & Scan Kamera Border Menyala */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-2xl border border-blue-300 dark:border-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.15)] focus-within:shadow-[0_0_14px_rgba(59,130,246,0.25)] transition-all">
        <div className="text-[#0866E9] dark:text-blue-400">
          <Search size={16} strokeWidth={2.5} />
        </div>
        <input 
          className="flex-grow bg-transparent outline-none text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 tracking-wide" 
          placeholder="CARI NAMA, BARCODE, SKU..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
        <button 
          onClick={() => setShowScanner(true)}
          className="p-1 rounded-lg text-[#0866E9] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          title="Scan Barcode Kamera"
        >
          <Scan size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* 3. Bar Kapsul Filter Kategori Berwarna & Bersih (No-Scrollbar) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {categories.map(c => {
          const isActive = selectedCategory === c;
          return (
            <button 
              key={c} 
              onClick={() => setSelectedCategory(c)} 
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all active:scale-95 cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-[#0866E9] to-blue-600 text-white shadow-xs font-semibold' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 hover:text-[#0866E9] dark:hover:text-blue-400 shadow-2xs'
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

      {/* 4. Daftar Kartu Produk Ringkas Horizontal */}
      <div className="grid grid-cols-1 gap-1.5">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            Tidak ada produk ditemukan
          </div>
        ) : (
          filteredProducts.map(p => (
            <div 
              key={p.id}
              onClick={() => {
                navigator.vibrate?.(10);
                setSelectedProduct(p);
              }}
              className="bg-white dark:bg-slate-900 flex items-center justify-between gap-2 py-2 px-3 border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 dark:hover:bg-slate-800/80 rounded-xl shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
            >
              {/* Sisi Kiri: Nama Produk & Barcode */}
              <div className="flex-1 min-w-0">
                <div className="text-xs md:text-sm font-medium text-slate-800 dark:text-slate-100 truncate leading-snug">
                  {p.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                  {p.barcode || p.sku || '-'}
                </div>
              </div>

              {/* Sisi Kanan: Harga Jual & Panah Kanan */}
              <div className="flex-none flex items-center gap-2">
                <span className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums whitespace-nowrap">
                  Rp {p.sellingPrice.toLocaleString('id-ID')}
                </span>
                <ChevronRight size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Bottom Sheet / Modal Detail Produk */}
      {selectedProduct && (
        <div
          onClick={() => setSelectedProduct(null)}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full md:max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-t-3xl md:rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[85dvh] overflow-y-auto animate-slide-up"
          >
            {/* Drag handle untuk mobile */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto md:hidden" />

            {/* Header Detail */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/70">
                    <Tag size={10} />
                    {selectedProduct.category || 'Umum'}
                  </span>
                  {selectedProduct.openingStock <= 0 ? (
                    <span className="text-[10px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 px-2 py-0.5 rounded-full">
                      Stok Habis
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 px-2 py-0.5 rounded-full tabular-nums">
                      Stok: {selectedProduct.openingStock} {selectedProduct.unit || 'Pcs'}
                    </span>
                  )}
                </div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedProduct.name}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {selectedProduct.id && (
                  <button
                    onClick={() => toggleFavorite(selectedProduct.id!)}
                    className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                      favorites.includes(selectedProduct.id)
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/70 text-amber-500'
                        : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title="Tandai Favorit"
                  >
                    <Star size={16} fill={favorites.includes(selectedProduct.id) ? 'currentColor' : 'none'} />
                  </button>
                )}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Rincian Metadata Produk */}
            <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-100 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <Barcode size={14} className="text-slate-400" />
                  Barcode / SKU
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                  {selectedProduct.barcode || '-'} {selectedProduct.sku ? `(${selectedProduct.sku})` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <Layers size={14} className="text-slate-400" />
                  Kategori
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedProduct.category || '-'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <Package size={14} className="text-slate-400" />
                  Jumlah Stok
                </span>
                {selectedProduct.openingStock <= 0 ? (
                  <span className="text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-md">
                    Stok Habis (0)
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {selectedProduct.openingStock} {selectedProduct.unit || 'Pcs'} tersedia
                  </span>
                )}
              </div>

              {selectedProduct.description && (
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Deskripsi</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedProduct.description}</p>
                </div>
              )}
            </div>

            {/* Harga Jual Utama */}
            <div className="flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/70 rounded-xl px-3.5 py-2.5">
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">Harga Jual</span>
              <span className="text-base md:text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                Rp {selectedProduct.sellingPrice.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Tombol Tutup */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      )}
    </div>
  );
};