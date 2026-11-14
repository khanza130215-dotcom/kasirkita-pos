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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
      <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] p-3.5 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-[16px] font-semibold mb-3 text-[#172033] dark:text-white leading-tight">{product ? 'Edit Produk' : 'Tambah Produk'}</h2>
        <div className="space-y-2.5">
          <div>
            <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1 block">SKU / Barcode</label>
            <div className="grid grid-cols-2 gap-2">
              <input className="w-full h-10 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-3 text-[12.5px] text-[#172033] dark:text-white outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900]" placeholder="SKU" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              <input className="w-full h-10 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-3 text-[12.5px] text-[#172033] dark:text-white outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900]" placeholder="Barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1 block">Nama Produk</label>
            <input className="w-full h-10 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-3 text-[12.5px] text-[#172033] dark:text-white outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900]" placeholder="Contoh: Kopi Susu" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1 block">Kategori</label>
            <input className="w-full h-10 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-3 text-[12.5px] text-[#172033] dark:text-white outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900]" placeholder="Contoh: Minuman" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1 block">Harga Jual</label>
              <input type="number" className="w-full h-10 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-3 text-[12.5px] font-semibold tabular-nums text-[#172033] dark:text-white outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900]" placeholder="0" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1 block">Stok Awal</label>
              <input type="number" className="w-full h-10 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl px-3 text-[12.5px] font-semibold tabular-nums text-[#172033] dark:text-white outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900]" placeholder="0" value={formData.openingStock} onChange={e => setFormData({...formData, openingStock: Number(e.target.value)})} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3.5">
          <Button onClick={() => onSave(formData)} className="flex-grow bg-[#0866E9] hover:bg-[#0758CC] text-white">Simpan</Button>
          <Button onClick={onClose} className="bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] text-[#172033] dark:text-white hover:opacity-85">Batal</Button>
        </div>
      </div>
    </div>
  );
};
