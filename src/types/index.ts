export type Product = {
  id?: number; // Product_ID
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  variant: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  openingStock: number;
  minimumStock: number;
  status: 'active' | 'inactive';
  isFavorite?: boolean;
};

export type CartItem = {
  productId: number;
  sku: string;
  barcode: string;
  productName: string;
  description: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
  addedAt: Date;
};

export type TransactionStatus = 'DRAFT' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'tunai' | 'transfer' | 'qris' | 'tempo';
export type PaymentStatus = 'PAID' | 'UNPAID' | 'REFUNDED';
export type MovementType = 'OUT' | 'IN' | 'RETURN' | 'ADJUSTMENT';
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export type Transaction = {
  id: string; // UUID
  createdAt: Date;
  status: TransactionStatus;
  storeId: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  notes: string;
  shiftId: number | null;
};

export type TransactionWithDetails = Transaction & {
  items: TransactionItem[];
  paymentMethod: string;
};

export type TransactionItem = {
  id?: number;
  transactionId: string;
  productId: number;
  sku: string;
  barcode: string;
  productName: string;
  unit: string;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
};

export type Payment = {
  id?: number;
  transactionId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
};

export type InventoryMovement = {
  id?: number;
  productId: number;
  locationId: number;
  transactionId?: string;
  type: MovementType;
  quantity: number;
};

export type SyncQueue = {
  id?: number;
  operation: 'CREATE_TRANS' | 'UPDATE_TRANS';
  payload: object;
  status: SyncStatus;
  retryCount: number;
  lastAttemptAt: Date | null;
  lastError: string | null;
  idempotencyKey: string; // UUID
};

export type Settings = {
  id?: number;
  key: string;
  value: string;
};

export type Shift = {
  id?: number;
  cashierName: string;
  openedAt: Date;
  closedAt: Date | null;
  initialCash: number;
  status: 'OPEN' | 'CLOSED';
};

export type CashMovement = {
  id?: number;
  shiftId: number;
  type: 'IN' | 'OUT' | 'EXPENSE';
  amount: number;
  reason: string;
  createdAt: Date;
};

export interface StoreSettings {
  id?: number;
  storeName: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  tagline?: string;
  footerMessage?: string;
  paperSize?: '58mm' | '80mm';
  autoPrint?: boolean;
  logo?: string;
  qrisImage?: string;
  qrisName?: string;
  favorites?: number[];
}