export const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculatePayment = (total: number, received: number) => {
  const change = Math.max(0, received - total);
  const shortage = Math.max(0, total - received);
  const isValid = received >= total;
  return { change, shortage, isValid };
};
