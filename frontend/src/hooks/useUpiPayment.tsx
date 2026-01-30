import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getUpiConfig,
  uploadPaymentScreenshot,
  getPaymentStatus,
  resubmitPayment
} from "@/lib/api";

export interface UpiConfig {
  upiId: string;
  merchantName: string;
  qrCodeImage?: string;
  instructions: string;
}

export interface PaymentStatus {
  hasPayment: boolean;
  paymentId?: string;
  status?: string;
  utr?: string;
  amount?: number;
  submittedAt?: Date;
  verifiedAt?: Date;
  adminNotes?: string;
  attempts?: number;
  expiresAt?: Date;
  isExpired?: boolean;
}

export interface UploadResult {
  paymentId: string;
  orderId: string;
  status: string;
  utrDetected: boolean;
  utr?: string;
  ocrConfidence: number;
  ocrData: {
    text: string;
    confidence: number;
    lineCount: number;
  };
}

interface UseUpiPaymentState {
  config: UpiConfig | null;
  loadingConfig: boolean;
  paymentStatus: PaymentStatus | null;
  loadingStatus: boolean;
  uploading: boolean;
  uploadProgress: number;
  lastUploadResult: UploadResult | null;
  error: string | null;
}

const initialState: UseUpiPaymentState = {
  config: null,
  loadingConfig: false,
  paymentStatus: null,
  loadingStatus: false,
  uploading: false,
  uploadProgress: 0,
  lastUploadResult: null,
  error: null
};

export const useUpiPayment = () => {
  const { toast } = useToast();
  const [state, setState] = useState<UseUpiPaymentState>(initialState);

  /**
   * Load UPI configuration
   */
  const loadUpiConfig = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingConfig: true, error: null }));

      const response = await getUpiConfig();

      if (!response.success) {
        throw new Error(response.message || "Failed to load UPI configuration");
      }

      setState(prev => ({
        ...prev,
        config: response.data,
        loadingConfig: false
      }));

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load configuration";
      setState(prev => ({
        ...prev,
        loadingConfig: false,
        error: errorMessage
      }));

      toast({
        title: "Configuration Error",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  }, [toast]);

  /**
   * Upload payment screenshot
   */
  const uploadScreenshot = useCallback(
    async (orderId: string, file: File) => {
      try {
        setState(prev => ({
          ...prev,
          uploading: true,
          uploadProgress: 0,
          error: null
        }));

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setState(prev => ({
            ...prev,
            uploadProgress: Math.min(prev.uploadProgress + Math.random() * 30, 90)
          }));
        }, 300);

        const response = await uploadPaymentScreenshot(orderId, file);

        clearInterval(progressInterval);
        setState(prev => ({ ...prev, uploadProgress: 100 }));

        if (!response.success) {
          throw new Error(response.message || "Upload failed");
        }

        setState(prev => ({
          ...prev,
          uploading: false,
          uploadProgress: 100,
          lastUploadResult: response.data
        }));

        // Auto-clear progress after 2 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, uploadProgress: 0 }));
        }, 2000);

        return response.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setState(prev => ({
          ...prev,
          uploading: false,
          uploadProgress: 0,
          error: errorMessage
        }));

        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive"
        });

        throw error;
      }
    },
    [toast]
  );

  /**
   * Get payment status
   */
  const checkPaymentStatus = useCallback(
    async (orderId: string) => {
      try {
        setState(prev => ({
          ...prev,
          loadingStatus: true,
          error: null
        }));

        const response = await getPaymentStatus(orderId);

        if (!response.success) {
          throw new Error(response.message || "Failed to fetch payment status");
        }

        setState(prev => ({
          ...prev,
          paymentStatus: response.data,
          loadingStatus: false
        }));

        return response.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch status";
        setState(prev => ({
          ...prev,
          loadingStatus: false,
          error: errorMessage
        }));

        throw error;
      }
    },
    []
  );

  /**
   * Resubmit payment screenshot
   */
  const retryPayment = useCallback(
    async (orderId: string, file: File) => {
      try {
        setState(prev => ({
          ...prev,
          uploading: true,
          uploadProgress: 0,
          error: null
        }));

        const response = await resubmitPayment(orderId, file);

        if (!response.success) {
          throw new Error(response.message || "Resubmission failed");
        }

        setState(prev => ({
          ...prev,
          uploading: false,
          uploadProgress: 100,
          lastUploadResult: response.data
        }));

        toast({
          title: "Payment Resubmitted",
          description: "Your payment screenshot has been resubmitted for verification"
        });

        return response.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Resubmission failed";
        setState(prev => ({
          ...prev,
          uploading: false,
          uploadProgress: 0,
          error: errorMessage
        }));

        toast({
          title: "Resubmission Failed",
          description: errorMessage,
          variant: "destructive"
        });

        throw error;
      }
    },
    [toast]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    loadUpiConfig,
    uploadScreenshot,
    checkPaymentStatus,
    retryPayment,
    reset,
    clearError,

    // Derived state
    isLoading: state.loadingConfig || state.loadingStatus || state.uploading,
    canRetry: state.paymentStatus?.attempts && state.paymentStatus.attempts < 3,
    isVerified: state.paymentStatus?.status === "verified",
    isRejected: state.paymentStatus?.status === "rejected",
    isPending: state.paymentStatus?.status === "pending_verification"
  };
};

export default useUpiPayment;