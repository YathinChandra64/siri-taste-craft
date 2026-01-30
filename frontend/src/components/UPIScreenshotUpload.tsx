import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Upload, X, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OcrResult {
  utr?: string;
  ocrConfidence?: number;
  utrDetected: boolean;
  [key: string]: unknown;
}

interface UploadSuccessData {
  data: OcrResult;
  [key: string]: unknown;
}

interface UPIScreenshotUploadProps {
  orderId: string;
  amount: number;
  onSuccess: (data: OcrResult) => void;
  onError?: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

type ProcessingStatus =
  | "idle"
  | "uploading"
  | "ocr_processing"
  | "validating"
  | "complete"
  | "error";

const UPIScreenshotUpload = ({
  orderId,
  amount,
  onSuccess,
  onError,
  onLoadingChange,
}: UPIScreenshotUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
      toast({
        title: "Invalid File",
        description: "Only JPEG, PNG, and WebP images are supported",
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxSize) {
      setError("File is too large. Maximum size is 5MB.");
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-purple-500", "bg-purple-950/20");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("border-purple-500", "bg-purple-950/20");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-purple-500", "bg-purple-950/20");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const changeEvent = new Event("change", { bubbles: true });
      const input = fileInputRef.current;
      if (input) {
        input.files = files;
        input.dispatchEvent(changeEvent);
        handleFileSelect({
          target: input,
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  // Upload and process
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a screenshot to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      onLoadingChange?.(true);
      setProcessingStatus("uploading");
      setError(null);

      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("screenshot", selectedFile);

      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 30, 90);
        setUploadProgress(Math.floor(progress));
      }, 300);

      // Upload file
      const response = await fetch("/api/upi-payments/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = (await response.json()) as UploadSuccessData;

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message || "Upload failed"
        );
      }

      // Processing stages
      setProcessingStatus("ocr_processing");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProcessingStatus("validating");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success
      setProcessingStatus("complete");
      setOcrResult(data.data);

      toast({
        title: "✅ Payment Processed Successfully!",
        description: data.data.utrDetected
          ? `UTR extracted: ${data.data.utr}`
          : "Screenshot received. We'll verify the UTR manually.",
        variant: "default",
      });

      onSuccess(data.data);
    } catch (error) {
      console.error("Upload error:", error);
      setProcessingStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setError(errorMessage);

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });

      onError?.(errorMessage);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
      setUploadProgress(0);
    }
  };

  // Reset form
  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setOcrResult(null);
    setProcessingStatus("idle");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileSize = selectedFile ? (selectedFile.size / 1024).toFixed(2) : "0";

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!ocrResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-600 transition bg-slate-800/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-1">
              Upload Payment Receipt
            </h3>
            <p className="text-slate-400 text-sm mb-3">
              Drag and drop or click to select
            </p>
            <p className="text-slate-500 text-xs">
              JPEG, PNG, or WebP • Max 5MB
            </p>
          </div>
        </motion.div>
      )}

      {/* File Preview */}
      <AnimatePresence>
        {preview && !ocrResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-white">Preview</h4>
                  {!loading && (
                    <button
                      onClick={handleReset}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded"
                />

                <div className="text-sm text-slate-400">
                  <p>
                    <strong>File:</strong> {selectedFile?.name}
                  </p>
                  <p>
                    <strong>Size:</strong> {fileSize} KB
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-red-950/30 border-red-700/50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-100 mb-1">Error</h4>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Processing Status */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="space-y-3">
                {/* Progress Steps */}
                <div className="space-y-2">
                  {[
                    { stage: "uploading" as const, label: "Uploading screenshot..." },
                    {
                      stage: "ocr_processing" as const,
                      label: "Extracting text with OCR...",
                    },
                    { stage: "validating" as const, label: "Validating UTR..." },
                    { stage: "complete" as const, label: "Processing complete!" },
                  ].map(({ stage, label }) => (
                    <div key={stage} className="flex items-center gap-3">
                      {processingStatus === stage ? (
                        <Loader className="w-4 h-4 text-purple-600 animate-spin" />
                      ) : ["ocr_processing", "validating", "complete"].includes(
                          processingStatus
                        ) &&
                        ["uploading", "ocr_processing", "validating"].includes(
                          stage
                        ) ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600" />
                      )}
                      <span className="text-slate-400 text-sm">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-r from-purple-600 to-purple-400 h-full"
                  />
                </div>

                <p className="text-slate-400 text-xs text-center">
                  {uploadProgress}% complete
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OCR Result */}
      <AnimatePresence>
        {ocrResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              className={`${
                ocrResult.utrDetected
                  ? "bg-green-950/30 border-green-700/50"
                  : "bg-yellow-950/30 border-yellow-700/50"
              } p-4`}
            >
              <div className="flex gap-3">
                <div className="mt-1">
                  {ocrResult.utrDetected ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-semibold mb-1 ${
                      ocrResult.utrDetected ? "text-green-100" : "text-yellow-100"
                    }`}
                  >
                    {ocrResult.utrDetected
                      ? "✅ UTR Extracted"
                      : "⚠️ UTR Not Detected"}
                  </h4>
                  {ocrResult.utrDetected && (
                    <div className="space-y-1 text-sm">
                      <p className="text-green-200">
                        <strong>UTR:</strong> {ocrResult.utr}
                      </p>
                      <p className="text-green-200">
                        <strong>Confidence:</strong> {ocrResult.ocrConfidence}%
                      </p>
                    </div>
                  )}
                  {!ocrResult.utrDetected && (
                    <p className="text-yellow-200 text-sm">
                      We couldn't automatically detect the UTR. Our team will
                      verify it manually.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!ocrResult ? (
          <>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Upload Screenshot"}
            </Button>
            {selectedFile && (
              <Button
                onClick={handleReset}
                disabled={loading}
                variant="outline"
                className="text-slate-300 border-slate-600"
              >
                Clear
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={handleReset}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Upload Another
            </Button>
            <Button disabled className="flex-1 bg-green-600/50">
              ✓ Submitted
            </Button>
          </>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-slate-400 text-center">
        💡 Our system automatically extracts the UTR using OCR. If it's not
        detected, we'll verify it manually.
      </p>
    </div>
  );
};

export default UPIScreenshotUpload;