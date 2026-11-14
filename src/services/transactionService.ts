import { db } from '../db/db';
import { Transaction, TransactionItem, Payment, SyncQueue } from '../types';
import { shiftService } from './shiftService';

const activeLocks = new Set<string>();

export const transactionService = {
  async createTransaction(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'shiftId'>,
    items: Omit<TransactionItem, 'id' | 'transactionId'>[],
    payments: Omit<Payment, 'id' | 'transactionId'>[],
    mode: 'lite' | 'pro',
    idempotencyKey?: string
  ) {
    const id = idempotencyKey || crypto.randomUUID();
    
    if (activeLocks.has(id)) throw new Error('Transaksi sedang diproses');
    activeLocks.add(id);

    try {
      // Check for existing transaction
      const existing = await db.transactions.get(id);
      if (existing) return id;

      const createdAt = new Date();
      const activeShift = await shiftService.getActiveShift();
      const activeShiftId = activeShift?.id;
      if (activeShiftId == null) {
        throw new Error('Tidak ada shift kasir aktif. Silakan buka shift terlebih dahulu.');
      }

      return await db.transaction('rw', [db.transactions, db.transaction_items, db.payments, db.inventory_movements, db.products, db.sync_queue], async () => {
        // 1. Pro Mode Stock Validation & Update
        if (mode === 'pro') {
          for (const item of items) {
            const product = await db.products.get(item.productId);
            if (!product || product.openingStock < item.quantity) {
              throw new Error(`Stok tidak mencukupi untuk: ${item.productName}`);
            }
            await db.products.update(item.productId, { openingStock: product.openingStock - item.quantity });
            await db.inventory_movements.add({
              productId: item.productId,
              locationId: 1,
              transactionId: id,
              type: 'OUT',
              quantity: item.quantity
            });
          }
        }

        // 2. Save Header
        const newTransaction: Transaction = { id, createdAt, shiftId: activeShiftId, ...transaction };
        await db.transactions.add(newTransaction);

        // 3. Save Items
        const transactionItems: TransactionItem[] = items.map(item => ({ ...item, transactionId: id }));
        await db.transaction_items.bulkAdd(transactionItems);

        // 4. Save Payments
        const transactionPayments: Payment[] = payments.map(payment => ({ ...payment, transactionId: id }));
        await db.payments.bulkAdd(transactionPayments);

        // 5. Save to Sync Queue
        const syncEntry: SyncQueue = {
          operation: 'CREATE_TRANS',
          payload: { transaction: newTransaction, items: transactionItems, payments: transactionPayments },
          status: 'PENDING',
          retryCount: 0,
          lastAttemptAt: null,
          lastError: null,
          idempotencyKey: id
        };
        await db.sync_queue.add(syncEntry);
        
        return id;
      });
    } finally {
      activeLocks.delete(id);
    }
  },

  async getTransactionHistory() {
    return await db.transactions.orderBy('createdAt').reverse().toArray();
  },

  async getTransactionById(id: string) {
    return await db.transactions.get(id);
  },

  async getTransactionItems(transactionId: string) {
    return await db.transaction_items.where('transactionId').equals(transactionId).toArray();
  },

  async getTransactionPayments(transactionId: string) {
    return await db.payments.where('transactionId').equals(transactionId).toArray();
  },

  async getAllTransactions() {
    const transactions = await db.transactions.orderBy('createdAt').reverse().toArray();
    const results = await Promise.all(transactions.map(async (t) => {
      const items = await db.transaction_items.where('transactionId').equals(t.id).toArray();
      const payments = await db.payments.where('transactionId').equals(t.id).toArray();
      return {
        ...t,
        items,
        paymentMethod: payments[0]?.method || 'TUNAI'
      };
    }));
    return results;
  }
};
