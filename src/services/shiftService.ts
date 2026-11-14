import { db } from '../db/db';
import { Shift } from '../types';

export const shiftService = {
  async openShift(cashierName: string, initialCash: number): Promise<number> {
    const active = await this.getActiveShift();
    if (active) throw new Error('Shift aktif sudah ada');

    return await db.shifts.add({
      cashierName,
      initialCash,
      openedAt: new Date(),
      closedAt: null,
      status: 'OPEN'
    });
  },

  async getActiveShift(): Promise<Shift | undefined> {
    return await db.shifts.where('status').equals('OPEN').first();
  },

  async closeShift(shiftId: number) {
    await db.shifts.update(shiftId, {
      closedAt: new Date(),
      status: 'CLOSED'
    });
  },

  async getShiftHistory(): Promise<Shift[]> {
    return await db.shifts.orderBy('openedAt').reverse().toArray();
  },

  async getShiftSummary(shiftId: number) {
    const transactions = await db.transactions.where('shiftId').equals(shiftId).toArray();
    const completedTransactions = transactions.filter(t => t.status === 'COMPLETED');
    const transIds = completedTransactions.map(t => t.id);
    
    const payments = await db.payments.where('transactionId').anyOf(transIds).toArray();
    const movements = await db.cash_movements.where('shiftId').equals(shiftId).toArray();
    
    const summary = payments.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
    }, {} as Record<string, number>);

    const cashIn = movements.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.amount, 0);
    const cashOut = movements.filter(m => m.type === 'OUT' || m.type === 'EXPENSE').reduce((sum, m) => sum + m.amount, 0);

    return {
        summary,
        cashIn,
        cashOut,
        completedTransactions: completedTransactions.length
    };
  }
};
