import { db } from './db';
import { Product, Transaction } from '../types';

const SEED_STORAGE_KEY = 'kasirkita_initial_seeded_v1';

let seedPromise: Promise<void> | null = null;

export function seedInitialData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeedInitialData();
  }
  return seedPromise;
}

async function runSeedInitialData() {
  if (typeof window !== 'undefined' && window.localStorage.getItem(SEED_STORAGE_KEY) === 'true') {
    return;
  }

  try {
    const productCount = await db.products.count();
    if (productCount === 0) {
      const sampleProducts: Omit<Product, 'id'>[] = [
        {
          sku: 'KOP-001',
          barcode: '8991001001',
          name: 'Kopi Susu Gula Aren',
          description: 'Kopi susu dengan gula aren asli pilihan',
          category: 'Minuman',
          brand: 'Lokal',
          variant: 'Reguler',
          unit: 'Cup',
          purchasePrice: 10000,
          sellingPrice: 18000,
          openingStock: 45,
          minimumStock: 5,
          status: 'active'
        },
        {
          sku: 'MIE-002',
          barcode: '8991001002',
          name: 'Indomie Goreng Spesial Jumbo',
          description: 'Mie instan goreng porsi jumbo spesial',
          category: 'Makanan',
          brand: 'Indofood',
          variant: 'Jumbo',
          unit: 'Pcs',
          purchasePrice: 3500,
          sellingPrice: 4500,
          openingStock: 120,
          minimumStock: 10,
          status: 'active'
        },
        {
          sku: 'SBR-003',
          barcode: '8991001003',
          name: 'Beras Premium Pandan Wangi 5kg Kemasan Karung',
          description: 'Beras wangi pulen kualitas premium',
          category: 'Sembako',
          brand: 'Pandan Wangi',
          variant: '5kg',
          unit: 'Karung',
          purchasePrice: 68000,
          sellingPrice: 74500,
          openingStock: 8,
          minimumStock: 2,
          status: 'active'
        },
        {
          sku: 'SBR-004',
          barcode: '8991001004',
          name: 'Minyak Goreng Sawit Refill 2 Liter',
          description: 'Minyak goreng nabati jernih berkualitas',
          category: 'Sembako',
          brand: 'SunCo',
          variant: '2L',
          unit: 'Pouch',
          purchasePrice: 30000,
          sellingPrice: 34000,
          openingStock: 3,
          minimumStock: 5,
          status: 'active'
        },
        {
          sku: 'MKN-005',
          barcode: '8991001005',
          name: 'Roti Bakar Cokelat Keju Lumer',
          description: 'Roti panggang dengan isian cokelat keju leleh',
          category: 'Makanan',
          brand: 'Bakery',
          variant: 'Special',
          unit: 'Porsi',
          purchasePrice: 10000,
          sellingPrice: 15000,
          openingStock: 22,
          minimumStock: 5,
          status: 'active'
        },
        {
          sku: 'MIN-006',
          barcode: '8991001006',
          name: 'Air Mineral Botol 600ml',
          description: 'Air mineral pegunungan alami',
          category: 'Minuman',
          brand: 'Aqua',
          variant: '600ml',
          unit: 'Botol',
          purchasePrice: 2500,
          sellingPrice: 3500,
          openingStock: 240,
          minimumStock: 20,
          status: 'active'
        },
        {
          sku: 'MIN-007',
          barcode: '8991001007',
          name: 'Susu UHT Full Cream 1000ml Kotak',
          description: 'Susu segar UHT kaya kalsium',
          category: 'Minuman',
          brand: 'Ultra Milk',
          variant: '1000ml',
          unit: 'Kotak',
          purchasePrice: 16500,
          sellingPrice: 19500,
          openingStock: 15,
          minimumStock: 3,
          status: 'active'
        },
        {
          sku: 'SBR-008',
          barcode: '8991001008',
          name: 'Gula Pasir Putih Kristal 1kg',
          description: 'Gula tebu murni manis alami',
          category: 'Sembako',
          brand: 'Gulaku',
          variant: '1kg',
          unit: 'Kg',
          purchasePrice: 15000,
          sellingPrice: 17500,
          openingStock: 0,
          minimumStock: 5,
          status: 'active'
        },
        {
          sku: 'MIN-009',
          barcode: '8991001009',
          name: 'Teh Tarik Melaka Dingin',
          description: 'Teh susu khas Melaka disajikan dingin',
          category: 'Minuman',
          brand: 'Melaka',
          variant: 'Cold',
          unit: 'Cup',
          purchasePrice: 8000,
          sellingPrice: 12000,
          openingStock: 34,
          minimumStock: 5,
          status: 'active'
        },
        {
          sku: 'PKT-010',
          barcode: '8991001010',
          name: 'Paket Bundling Hemat Sarapan Pagi Keluarga',
          description: 'Paket spesial sarapan roti, susu, dan kopi',
          category: 'Paket',
          brand: 'Bundle',
          variant: 'Family',
          unit: 'Paket',
          purchasePrice: 100000,
          sellingPrice: 125000,
          openingStock: 5,
          minimumStock: 2,
          status: 'active'
        }
      ];

      for (const p of sampleProducts) {
        await db.products.add(p as Product);
      }
    }

    const txCount = await db.transactions.count();
    if (txCount === 0) {
      const now = new Date();
      const daysAgo = (days: number, hoursOffset = 10) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, hoursOffset, 30, 0);
        return d;
      };
      const lastMonthDay = (day: number, hoursOffset = 14) => {
        return new Date(now.getFullYear(), now.getMonth() - 1, day, hoursOffset, 15, 0);
      };

      const seedTxs: Array<{
        tx: Transaction;
        method: 'tunai' | 'qris' | 'transfer';
        qty: number;
        itemName: string;
        sku: string;
        barcode: string;
        unit: string;
      }> = [
        {
          tx: { id: 'TRX-1030', createdAt: new Date(Date.now() - 3600000 * 1), status: 'COMPLETED', storeId: 1, totalAmount: 1450000, discountAmount: 0, finalAmount: 1450000, notes: '', shiftId: null },
          method: 'tunai', qty: 10, itemName: 'Paket Bundling Hemat Sarapan Pagi Keluarga', sku: 'PKT-010', barcode: '8991001010', unit: 'Paket'
        },
        {
          tx: { id: 'TRX-1029', createdAt: new Date(Date.now() - 3600000 * 3), status: 'COMPLETED', storeId: 1, totalAmount: 450000, discountAmount: 0, finalAmount: 450000, notes: '', shiftId: null },
          method: 'qris', qty: 6, itemName: 'Beras Premium Pandan Wangi 5kg Kemasan Karung', sku: 'SBR-003', barcode: '8991001003', unit: 'Karung'
        },
        {
          tx: { id: 'TRX-1028', createdAt: daysAgo(1, 16), status: 'COMPLETED', storeId: 1, totalAmount: 125000, discountAmount: 0, finalAmount: 125000, notes: '', shiftId: null },
          method: 'transfer', qty: 1, itemName: 'Paket Bundling Hemat Sarapan Pagi Keluarga', sku: 'PKT-010', barcode: '8991001010', unit: 'Paket'
        },
        {
          tx: { id: 'TRX-1027', createdAt: daysAgo(3, 11), status: 'COMPLETED', storeId: 1, totalAmount: 74500, discountAmount: 0, finalAmount: 74500, notes: '', shiftId: null },
          method: 'tunai', qty: 1, itemName: 'Beras Premium Pandan Wangi 5kg Kemasan Karung', sku: 'SBR-003', barcode: '8991001003', unit: 'Karung'
        },
        {
          tx: { id: 'TRX-1026', createdAt: daysAgo(5, 15), status: 'COMPLETED', storeId: 1, totalAmount: 34000, discountAmount: 0, finalAmount: 34000, notes: '', shiftId: null },
          method: 'qris', qty: 1, itemName: 'Minyak Goreng Sawit Refill 2 Liter', sku: 'SBR-004', barcode: '8991001004', unit: 'Pouch'
        },
        {
          tx: { id: 'TRX-1025', createdAt: daysAgo(6, 9), status: 'COMPLETED', storeId: 1, totalAmount: 19500, discountAmount: 0, finalAmount: 19500, notes: '', shiftId: null },
          method: 'tunai', qty: 1, itemName: 'Susu UHT Full Cream 1000ml Kotak', sku: 'MIN-007', barcode: '8991001007', unit: 'Kotak'
        },
        {
          tx: { id: 'TRX-1024', createdAt: new Date(now.getFullYear(), now.getMonth(), 2, 12, 30, 0), status: 'COMPLETED', storeId: 1, totalAmount: 45000, discountAmount: 0, finalAmount: 45000, notes: '', shiftId: null },
          method: 'tunai', qty: 3, itemName: 'Kopi Susu Gula Aren', sku: 'KOP-001', barcode: '8991001001', unit: 'Cup'
        },
        {
          tx: { id: 'TRX-1023', createdAt: lastMonthDay(25, 11), status: 'COMPLETED', storeId: 1, totalAmount: 120000, discountAmount: 0, finalAmount: 120000, notes: '', shiftId: null },
          method: 'qris', qty: 8, itemName: 'Roti Bakar Cokelat Keju Lumer', sku: 'MKN-005', barcode: '8991001005', unit: 'Porsi'
        },
        {
          tx: { id: 'TRX-1022', createdAt: lastMonthDay(18, 10), status: 'COMPLETED', storeId: 1, totalAmount: 15000, discountAmount: 0, finalAmount: 15000, notes: '', shiftId: null },
          method: 'tunai', qty: 1, itemName: 'Roti Bakar Cokelat Keju Lumer', sku: 'MKN-005', barcode: '8991001005', unit: 'Porsi'
        },
        {
          tx: { id: 'TRX-1021', createdAt: lastMonthDay(10, 14), status: 'COMPLETED', storeId: 1, totalAmount: 12500, discountAmount: 0, finalAmount: 12500, notes: '', shiftId: null },
          method: 'transfer', qty: 3, itemName: 'Indomie Goreng Spesial Jumbo', sku: 'MIE-002', barcode: '8991001002', unit: 'Pcs'
        },
      ];

      for (const entry of seedTxs) {
        await db.transactions.add(entry.tx);
        await db.payments.add({
          transactionId: entry.tx.id,
          method: entry.method,
          amount: entry.tx.finalAmount,
          status: 'PAID'
        });
        await db.transaction_items.add({
          transactionId: entry.tx.id,
          productId: 1,
          sku: entry.sku,
          barcode: entry.barcode,
          productName: entry.itemName,
          unit: entry.unit,
          price: Math.round(entry.tx.finalAmount / entry.qty),
          quantity: entry.qty,
          discount: 0,
          subtotal: entry.tx.finalAmount
        });
      }
    } else {
      const payCount = await db.payments.count();
      if (payCount === 0) {
        const existingTxs = await db.transactions.toArray();
        const methodMap: Record<string, 'tunai' | 'qris' | 'transfer'> = {
          'TRX-1030': 'tunai',
          'TRX-1029': 'qris',
          'TRX-1028': 'transfer',
          'TRX-1027': 'tunai',
          'TRX-1026': 'qris',
          'TRX-1025': 'tunai',
          'TRX-1024': 'tunai',
          'TRX-1023': 'qris',
          'TRX-1022': 'tunai',
          'TRX-1021': 'transfer',
        };
        for (const t of existingTxs) {
          await db.payments.add({
            transactionId: t.id,
            method: methodMap[t.id] || 'tunai',
            amount: t.finalAmount || t.totalAmount || 0,
            status: 'PAID'
          });
        }
      }
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SEED_STORAGE_KEY, 'true');
    }
  } catch (err) {
    console.error('Gagal melakukan seeding data awal:', err);
  }
}
