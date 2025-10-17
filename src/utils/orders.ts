import { CartItem } from './cart';

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
}

const ORDERS_KEY = 'userOrders';

export const getOrders = (): Order[] => {
  const orders = localStorage.getItem(ORDERS_KEY);
  return orders ? JSON.parse(orders) : [];
};

export const addOrder = (items: CartItem[], total: number): Order => {
  const orders = getOrders();
  const newOrder: Order = {
    id: `ORD-${Date.now()}`,
    date: new Date().toISOString(),
    items,
    total,
    status: 'completed'
  };
  
  orders.unshift(newOrder); // Add to beginning
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  
  return newOrder;
};

export const getOrderById = (id: string): Order | null => {
  const orders = getOrders();
  return orders.find(order => order.id === id) || null;
};
