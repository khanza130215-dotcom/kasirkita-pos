import Dexie, { Table } from 'dexie';
import { Product, Settings, Transaction, TransactionItem, Payment, InventoryMovement, SyncQueue, Shift, CashMovement } from '../types';

export class KasirKitaDB extends Dexie {
  products!: Table<Product>;
  categories!: Table<{ id?: number; name: string }>;
  units!: Table<{ id?: number; name: string }>;
  settings!: Table<import('../types').StoreSettings>;
  stores!: Table<{ 
    id?: number; 
    name: string; 
    address: string; 
    phone?: string;
    whatsapp?: string;
    tagline?: string;
    footerReceipt?: string;
  }>;
  transactions!: Table<Transaction>;
  transaction_items!: Table<TransactionItem>;
  payments!: Table<Payment>;
  inventory_movements!: Table<InventoryMovement>;
  sync_queue!: Table<SyncQueue>;
  shifts!: Table<Shift>;
  cash_movements!: Table<CashMovement>;

  constructor() {
    super('KasirKitaDB');
    this.version(2).stores({
      products: '++id, &barcode, &sku, name, category, status',
      categories: '++id, name',
      units: '++id, name',
      settings: '++id, &key',
      stores: '++id, name',
      transactions: '&id, createdAt, status',
      transaction_items: '++id, transactionId, productId',
      payments: '++id, transactionId',
      inventory_movements: '++id, productId, transactionId',
      sync_queue: '++id, &idempotencyKey, status'
    });
    this.version(3).stores({
      products: '++id, &barcode, &sku, name, category, status',
      categories: '++id, name',
      units: '++id, name',
      settings: '++id, &key',
      stores: '++id, name',
      transactions: '&id, createdAt, status',
      transaction_items: '++id, transactionId, productId',
      payments: '++id, transactionId',
      inventory_movements: '++id, productId, transactionId',
      sync_queue: '++id, &idempotencyKey, status',
      shifts: '++id, status, openedAt',
      cash_movements: '++id, shiftId, type, createdAt'
    }).upgrade(async tx => {
      await tx.table('transactions').toCollection().modify(t => {
        t.shiftId = null;
      });
    });
  }
}

export const db = new KasirKitaDB();
