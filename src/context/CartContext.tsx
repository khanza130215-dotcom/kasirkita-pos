import * as React from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  increaseQuantity: (productId: number) => void;
  decreaseQuantity: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getTotalQuantity: () => number;
}

const CartContext = React.createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = React.useState<CartItem[]>([]);

  const addToCart = React.useCallback((product: Product) => {
    if (product.status === 'inactive') return;
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id 
          ? {...item, quantity: item.quantity + 1, lineSubtotal: (item.quantity + 1) * item.unitPrice} 
          : item);
      }
      return [...prev, {
        productId: product.id!,
        sku: product.sku,
        barcode: product.barcode,
        productName: product.name,
        description: product.description,
        unit: product.unit,
        unitPrice: product.sellingPrice,
        quantity: 1,
        lineSubtotal: product.sellingPrice,
        addedAt: new Date()
      }];
    });
  }, []);

  const increaseQuantity = (productId: number) => {
    setCart(prev => prev.map(item => item.productId === productId 
      ? {...item, quantity: item.quantity + 1, lineSubtotal: (item.quantity + 1) * item.unitPrice} 
      : item));
  };

  const decreaseQuantity = (productId: number) => {
    setCart(prev => prev.map(item => item.productId === productId && item.quantity > 1
      ? {...item, quantity: item.quantity - 1, lineSubtotal: (item.quantity - 1) * item.unitPrice} 
      : item));
  };

  const removeFromCart = (productId: number) => {
    if (confirm('Hapus barang dari keranjang?')) {
      setCart(prev => prev.filter(item => item.productId !== productId));
    }
  };

  const clearCart = () => {
    if (confirm('Kosongkan keranjang?')) {
      setCart([]);
    }
  };

  const getCartSubtotal = () => cart.reduce((sum, item) => sum + item.lineSubtotal, 0);
  const getTotalQuantity = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart, getCartSubtotal, getTotalQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => React.useContext(CartContext);
