import { db } from '../db/db';
import { Transaction, TransactionItem, Payment, Product } from '../types';

export const dashboardService = {
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTransactions = await db.transactions.toArray();
    const todayTransactions = allTransactions.filter(t => 
      new Date(t.createdAt).setHours(0, 0, 0, 0) === today.getTime()
    );

    const completedTransactions = todayTransactions.filter(t => t.status === 'COMPLETED');
    
    // Omzet & Transaksi
    const totalOmzet = completedTransactions.reduce((sum, t) => sum + t.finalAmount, 0);
    const countCompleted = completedTransactions.length;
    const avgTransaction = countCompleted > 0 ? totalOmzet / countCompleted : 0;

    // Pembayaran
    const transactionIds = completedTransactions.map(t => t.id);
    const allPayments = await db.payments.where('transactionId').anyOf(transactionIds).toArray();
    
    const paymentSummary = allPayments.reduce((acc, p) => {
      if (p.status === 'PAID') {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    // Piutang (Tempo)
    const tempoPayments = allPayments.filter(p => p.method === 'tempo' && p.status === 'UNPAID');
    const totalPiutang = tempoPayments.reduce((sum, p) => sum + p.amount, 0);

    // Produk Terlaris (snapshot items)
    const allItems = await db.transaction_items.where('transactionId').anyOf(transactionIds).toArray();
    const productSales = allItems.reduce((acc, item) => {
      acc[item.productId] = acc[item.productId] || { name: item.productName, qty: 0, sales: 0 };
      acc[item.productId].qty += item.quantity;
      acc[item.productId].sales += item.subtotal;
      return acc;
    }, {} as Record<number, { name: string, qty: number, sales: number }>);
    
    const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);

    // Peringatan Stok
    const lowStockProducts = await db.products.filter(p => p.status === 'active' && p.openingStock <= p.minimumStock).toArray();

    return {
      totalOmzet,
      countCompleted,
      avgTransaction,
      paymentSummary,
      totalPiutang,
      topProducts,
      lowStockProducts,
      recentTransactions: completedTransactions.slice(0, 5)
    };
  }
};
