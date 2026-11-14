import { db } from '../db/db';
import { Product, MovementType } from '../types';

export const productServices = {
  async getAllProducts() {
    return await db.products.toArray();
  },

  async addProduct(product: Omit<Product, 'id'>) {
    if (product.barcode && await db.products.where('barcode').equals(product.barcode).count() > 0) throw new Error('Barcode duplikat');
    if (product.sku && await db.products.where('sku').equals(product.sku).count() > 0) throw new Error('SKU duplikat');
    return await db.products.add(product as Product);
  },

  async updateProduct(id: number, product: Partial<Product>) {
    return await db.products.update(id, product);
  },

  async toggleProductStatus(id: number, status: 'active' | 'inactive') {
    return await db.products.update(id, { status });
  },

  async deleteProduct(id: number) {
    return await db.products.delete(id);
  },

  async searchProducts(query: string, category?: string, status?: 'active' | 'inactive') {
    let collection = db.products.toCollection();
    if (query) {
      collection = collection.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.barcode.includes(query) || 
        p.sku.includes(query)
      );
    }
    if (category) collection = collection.filter(p => p.category === category);
    if (status) collection = collection.filter(p => p.status === status);
    return await collection.toArray();
  },

  async adjustStock(productId: number, quantity: number, type: MovementType, reason: string) {
    return await db.transaction('rw', db.products, db.inventory_movements, async () => {
      const product = await db.products.get(productId);
      if (!product) throw new Error('Produk tidak ditemukan');
      
      const newStock = product.openingStock + quantity;
      await db.products.update(productId, { openingStock: newStock });
      
      await db.inventory_movements.add({
        productId,
        locationId: 1, // Default location
        type,
        quantity,
      });
    });
  },

  generateCSVTemplate() {
    const headers = [
      'SKU', 'Barcode', 'Nama Barang', 'Deskripsi', 
      'Kategori', 'Merek', 'Varian', 'Satuan', 'Harga Beli', 
      'Harga Jual', 'Stok Awal', 'Stok Minimum', 'Status', 'Keterangan'
    ];
    return '\uFEFF' + headers.join(',');
  },

  async exportToCSV() {
    const products = await db.products.toArray();
    const headers = [
      'SKU', 'Barcode', 'Nama Barang', 'Deskripsi', 
      'Kategori', 'Merek', 'Varian', 'Satuan', 'Harga Beli', 
      'Harga Jual', 'Stok Awal', 'Stok Minimum', 'Status', 'Keterangan'
    ];
    const rows = products.map(p => [
      p.sku, p.barcode, p.name, p.description, 
      p.category, p.brand, p.variant, p.unit, p.purchasePrice, 
      p.sellingPrice, p.openingStock, p.minimumStock, p.status, ''
    ]);
    return '\uFEFF' + [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  async validateImportData(data: any[]) {
    const report = { valid: [] as any[], errors: [] as any[] };
    const dbProducts = await db.products.toArray();
    const seenSku = new Set<string>();
    const seenBarcode = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const errors = [];
      if (!item['Nama Barang']) errors.push('Nama Barang wajib');
      if (!item['SKU']) errors.push('SKU wajib');
      if (item['SKU'] && (seenSku.has(item['SKU']) || dbProducts.some(p => p.sku === item['SKU']))) errors.push('SKU duplikat');
      if (item['Barcode'] && (seenBarcode.has(item['Barcode']) || dbProducts.some(p => p.barcode === item['Barcode']))) errors.push('Barcode duplikat');
      if (Number(item['Harga Jual']) < 0) errors.push('Harga Jual tidak boleh negatif');
      
      if (errors.length > 0) {
        report.errors.push({ row: i + 2, errors });
      } else {
        report.valid.push(item);
        if (item['SKU']) seenSku.add(item['SKU']);
        if (item['Barcode']) seenBarcode.add(item['Barcode']);
      }
    }
    return report;
  },

  async importFromCSV(data: any[]) {
    return await db.transaction('rw', db.products, async () => {
      for (const item of data) {
        const product: Omit<Product, 'id'> = {
          sku: item['SKU'],
          barcode: item['Barcode'],
          name: item['Nama Barang'],
          description: item['Deskripsi'],
          category: item['Kategori'],
          brand: item['Merek'],
          variant: item['Varian'],
          unit: item['Satuan'],
          purchasePrice: Number(item['Harga Beli']),
          sellingPrice: Number(item['Harga Jual']),
          openingStock: Number(item['Stok Awal']),
          minimumStock: Number(item['Stok Minimum']),
          status: item['Status'] === 'active' ? 'active' : 'inactive'
        };
        await db.products.add(product as Product);
      }
      return { count: data.length };
    });
  }
};
