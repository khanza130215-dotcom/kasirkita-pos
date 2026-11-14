import { db } from '../db/db';
import { CashMovement, MovementType } from '../types';

export const cashMovementService = {
  async addMovement(shiftId: number, type: 'IN' | 'OUT', amount: number, reason: string) {
    if (amount <= 0) throw new Error('Nominal harus lebih besar dari 0');
    
    return await db.cash_movements.add({
      shiftId,
      type,
      amount,
      reason,
      createdAt: new Date()
    });
  },

  async getMovementsByShift(shiftId: number): Promise<CashMovement[]> {
    return await db.cash_movements.where('shiftId').equals(shiftId).toArray();
  }
};
