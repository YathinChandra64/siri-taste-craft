/**
 * Razorpay TypeScript Type Definitions
 * ✅ FIXED: Proper types instead of 'any'
 * NOTE: This file declares Window.Razorpay ONLY ONCE globally
 */

/**
 * Razorpay payment response from successful payment
 */
export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Razorpay payment options for initializing payment
 */
export interface RazorpayPaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
  };
  retry?: {
    enabled?: boolean;
    max_count?: number;
  };
  timeout?: number;
  recurring?: string;
  subscription_notify?: number;
  expire_by?: number;
  expire_at?: number;
  first_min_partial_amount?: number;
  notes?: Record<string, string>;
}

/**
 * Razorpay checkout instance
 */
export interface RazorpayInstance {
  open: () => void;
  close?: () => void;
}

/**
 * Razorpay constructor interface
 */
export interface RazorpayConstructor {
  new (options: RazorpayPaymentOptions): RazorpayInstance;
}

/**
 * ✅ Window type declaration for Razorpay
 * This is the SINGLE global declaration - no duplicates!
 */
declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export {};