export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: 'saree' | 'sweet';
  image: string;
}

const CART_KEY = 'userCart';

export const getCart = (): CartItem[] => {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
};

export const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1): void => {
  const cart = getCart();
  const existingItem = cart.find(i => i.id === item.id && i.type === item.type);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const removeFromCart = (id: number, type: 'saree' | 'sweet'): void => {
  const cart = getCart().filter(item => !(item.id === id && item.type === type));
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const updateCartQuantity = (id: number, type: 'saree' | 'sweet', quantity: number): void => {
  const cart = getCart();
  const item = cart.find(i => i.id === id && i.type === type);
  
  if (item) {
    if (quantity <= 0) {
      removeFromCart(id, type);
    } else {
      item.quantity = quantity;
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }
  }
};

export const clearCart = (): void => {
  localStorage.removeItem(CART_KEY);
};

export const getCartTotal = (): number => {
  return getCart().reduce((total, item) => total + (item.price * item.quantity), 0);
};
