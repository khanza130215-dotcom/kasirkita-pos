import { Transaction, TransactionItem, Payment } from '../../types';
import { formatRupiah } from '../../utils/paymentUtils';

export const Receipt = ({ trans, items, payments, store, width }: { trans: Transaction, items: TransactionItem[], payments: Payment[], store: any, width: string }) => (
  <div id="receipt-content" className="p-4 bg-white text-black mx-auto" style={{ width: width === '58' ? '180px' : '280px' }}>
    <h2 className="text-center font-bold">{store?.name || 'KASIRKITA'}</h2>
    <p className="text-center text-xs">{store?.address}</p>
    <p className="text-center text-xs">{store?.phone}</p>
    <div className="border-t border-dashed my-2"></div>
    <p className="text-center text-xs">Transaksi: {trans.id}</p>
    <div className="border-t border-dashed my-2"></div>
    {items.map(item => (
      <div key={item.id} className="text-xs flex justify-between">
        <span>{item.productName} x{item.quantity}</span>
        <span>{formatRupiah(item.subtotal)}</span>
      </div>
    ))}
    <div className="border-t border-dashed my-2"></div>
    <div className="font-bold flex justify-between">
      <span>Total</span>
      <span>{formatRupiah(trans.finalAmount)}</span>
    </div>
    <div className="text-center text-xs mt-2">{store?.footer}</div>
  </div>
);
