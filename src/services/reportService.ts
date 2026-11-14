import { db } from '../db/db';
import { Transaction, TransactionItem, Payment } from '../types';

export const reportService = {
  async getReportData(startDate?: Date, endDate?: Date, paymentMethod?: string, cashierName?: string) {
    let collection = db.transactions.where('status').equals('COMPLETED');
    
    // Applying date filter (basic filtering)
    if (startDate) {
        collection = collection.and(t => t.createdAt >= startDate);
    }
    if (endDate) {
        collection = collection.and(t => t.createdAt <= endDate);
    }
    
    const transactions = await collection.toArray();
    
    // Further filtering by payment method and cashier (requires more complex joins/filtering)
    const transactionIds = transactions.map(t => t.id);
    const items = await db.transaction_items.where('transactionId').anyOf(transactionIds).toArray();
    const payments = await db.payments.where('transactionId').anyOf(transactionIds).toArray();
    
    // Filter by payment method
    let filteredTransactions = transactions;
    if (paymentMethod) {
        const matchingTransactionIds = payments.filter(p => p.method === paymentMethod).map(p => p.transactionId);
        filteredTransactions = transactions.filter(t => matchingTransactionIds.includes(t.id));
    }
    
    // Note: 'cashierName' is not in Transaction type, it seems to be linked via shiftId.
    // Let's check shift record if needed later. For now, filter transactions based on available info.
    
    return { transactions: filteredTransactions, items, payments };
  },

  async generateCSV(data: { transactions: Transaction[], items: TransactionItem[] }, summary: any) {
    const headers = ['No', 'Barcode/ID Barang', 'Nama/Detail Barang', 'Qty', 'Harga Satuan', 'Total Harga'];
    const rows = data.items.map((item, index) => [
      index + 1,
      item.barcode || item.sku || item.productId,
      item.productName,
      item.quantity,
      item.price,
      item.subtotal
    ]);
    
    const summaryRows = [
      ['', '', '', '', 'Total Qty Terjual', summary.totalQty],
      ['', '', '', '', 'Total Omzet Kotor', summary.grossTurnover],
      ['', '', '', '', 'Total Transaksi', summary.totalTransactions],
      ['', '', '', '', 'Total Diskon', summary.totalDiscount],
      ['', '', '', '', 'Penjualan Bersih', summary.netSales],
    ];

    return '\uFEFF' + [headers, ...rows, ...summaryRows].map(row => row.join(',')).join('\n');
  }
};
