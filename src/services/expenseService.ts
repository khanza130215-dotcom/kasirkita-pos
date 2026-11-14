import { db } from '../db/db';
import { CashMovement } from '../types';
import { shiftService } from './shiftService';

export const expenseService = {
  async addExpense(amount: number, reason: string, category: string) {
    const shift = await shiftService.getActiveShift();
    if (!shift) throw new Error('Tidak ada shift aktif');

    return await db.cash_movements.add({
      shiftId: shift.id!,
      type: 'EXPENSE',
      amount,
      reason: `${category}: ${reason}`,
      createdAt: new Date()
    });
  },

  async getExpenseHistory(startDate?: Date, endDate?: Date) {
    let collection = db.cash_movements.where('type').equals('EXPENSE');
    if (startDate) collection = collection.and(c => c.createdAt >= startDate);
    if (endDate) collection = collection.and(c => c.createdAt <= endDate);
    return await collection.reverse().sortBy('createdAt');
  }
};
