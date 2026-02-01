// File: frontend/src/types/checkout.ts

export interface Address {
  _id?: string;
  fullName: string;
  mobileNumber: string;
  houseFlat: string;
  streetArea: string;
  city: string;
  state: string;
  pincode: string;
  addressType: "Home" | "Work";
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderAddress {
  fullName: string;
  mobileNumber: string;
  houseFlat: string;
  streetArea: string;
  city: string;
  state: string;
  pincode: string;
  addressType: "Home" | "Work";
}

export interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  _id?: string;
  user?: string;
  items: OrderItem[];
  totalAmount: number;
  address: OrderAddress;
  paymentMethod: "COD" | "UPI";
  orderStatus: "PLACED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "COD_PENDING" | "PENDING" | "PAYMENT_SUBMITTED" | "VERIFIED" | "REJECTED" | "COMPLETED";
  paymentReference?: string;
  paymentProof?: string;
  paymentSubmittedAt?: string;
  paymentVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckoutState {
  paymentMethod: "COD" | "UPI";
  addressId?: string;
  newAddress?: Address;
  isAddingNewAddress: boolean;
}