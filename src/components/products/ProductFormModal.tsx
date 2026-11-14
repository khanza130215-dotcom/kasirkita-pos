import { useState } from 'react';
import { Product } from '../../types';
import { Button } from '../ui/Button';

interface ProductFormModalProps {
  product?: Product | null;
  onSave: (product: Omit<Product, 'id'>) => void;
  onClose: () => void;
  initialBarcode?: string;
}

export const ProductFormModal = ({ product, onSave, onClose, initialBarcode }: ProductFormModalProps) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    brand: product?.brand || '',
    variant: product?.variant || '',
    unit: product?.unit || '',
    purchasePrice: product?.purchasePrice || 0,
    sellingPrice: product?.sellingPrice || 0,
    openingStock: product?.openingStock || 0,
    minimumStock: product?.minimumStock || 0,
    status: product?.status || 'active'
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">{product ? 'Edit Produk' : 'Tambah Produk'}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">SKU / BARCODE</label>
            <div className="grid grid-cols-2 gap-2">
              <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500" placeholder="SKU" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500" placeholder="Barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Nama Produk</label>
            <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500" placeholder="Contoh: Kopi Susu" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Kategori</label>
            <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500" placeholder="Contoh: Minuman" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Harga Jual</label>
              <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500" placeholder="0" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Stok Awal</label>
              <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500" placeholder="0" value={formData.openingStock} onChange={e => setFormData({...formData, openingStock: Number(e.target.value)})} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button onClick={() => onSave(formData)} className="flex-grow bg-[var(--primary-accent)] text-white">Simpan</Button>
          <Button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-80">Batal</Button>
        </div>
      </div>
    </div>
  );
};
