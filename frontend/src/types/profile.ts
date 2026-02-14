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

// ✅ FIXED: OrderItem now correctly uses string for product (MongoDB ObjectId)
export interface OrderItem {
  product: string | Saree; // ✅ MongoDB ObjectId as string
  name: string;
  quantity: number;
  price: number;
}

export interface ShippingInfo {
  shipper?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  location?: string;
  estimatedDeliveryDate?: string;
  currentLocation?: string;
  carrier?: string;
}

export interface Order {
  _id: string;
  user: string | User;
  items: OrderItem[];
  totalAmount: number;
  status: "pending_payment" | "payment_submitted" | "confirmed" | "payment_rejected" | "shipped" | "delivered" | "cancelled";
  orderStatus?: string; // New field for order tracking status
  shipping?: ShippingInfo; // New field for shipping details
  paymentReference?: string;
  paymentProof?: string;
  paymentMethod?: "upi" | "card" | "net_banking";
  deliveryAddress?: string; // Customer's delivery address
  createdAt: string;
  updatedAt: string;
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