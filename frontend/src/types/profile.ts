export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  profileImage: string | null;
  role: "admin" | "customer";
  createdAt: string;
}

export interface CartItem {
  _id: string;
  user: string;
  saree: Saree;
  quantity: number;
  addedAt: string;
}

export interface Saree {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  description: string;
  material?: string;
  color?: string;
}

export interface Order {
  _id: string;
  user: string | User;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: Saree;
  quantity: number;
  price: number;
}

export interface CartSummary {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: { _id: string; count: number }[];
  recentOrders: Order[];
}