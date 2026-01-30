/**
 * OCR Service
 * Handles image processing and text extraction using Tesseract.js
 */

import Tesseract from "tesseract.js";
import sharp from "sharp";
import { extractUtr, extractExplicitUtr } from "../utils/utrValidator.js";
import fs from "fs/promises";
import path from "path";

class OcrService {
  constructor() {
    this.tesseractWorker = null;
    this.isWorkerInitialized = false;
  }

  /**
   * Initialize Tesseract worker
   */
  async initializeWorker() {
    if (this.isWorkerInitialized) {
      return this.tesseractWorker;
    }

    try {
      console.log("🔨 Initializing Tesseract Worker...");
      this.tesseractWorker = await Tesseract.createWorker("eng");
      this.isWorkerInitialized = true;
      console.log("✅ Tesseract Worker initialized");
      return this.tesseractWorker;
    } catch (error) {
      console.error("❌ Failed to initialize Tesseract Worker:", error);
      throw new Error("OCR service initialization failed");
    }
  }

  /**
   * Terminate Tesseract worker
   */
  async terminateWorker() {
    if (this.tesseractWorker && this.isWorkerInitialized) {
      try {
        await this.tesseractWorker.terminate();
        this.isWorkerInitialized = false;
        console.log("✅ Tesseract Worker terminated");
      } catch (error) {
        console.error("Error terminating worker:", error);
      }
    }
  }

  /**
   * Validate image file
   * @param {Object} file - Express file object
   * @returns {Object} - { isValid, error }
   */
  validateImageFile(file) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    if (!file) {
      return { isValid: false, error: "No file provided" };
    }

    if (file.size > MAX_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds 5MB limit (Current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
      };
    }

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed: JPEG, PNG, WebP`
      };
    }

    return { isValid: true };
  }

  /**
   * Process image for better OCR results
   * Enhance contrast, brightness, and clarity
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Buffer>} - Processed image buffer
   */
  async preprocessImage(imagePath) {
    try {
      console.log("🖼️  Preprocessing image...");

      const processedImage = await sharp(imagePath)
        .resize(2000, 2000, {
          fit: "inside",
          withoutEnlargement: true
        })
        .toColorspace("srgb")
        .modulate({
          brightness: 1.1, // Slightly increase brightness
          contrast: 1.2,   // Increase contrast
          saturation: 0.8  // Slightly desaturate
        })
        .sharpen({
          sigma: 1.5
        })
        .toBuffer();

      console.log("✅ Image preprocessing complete");
      return processedImage;
    } catch (error) {
      console.error("Error preprocessing image:", error);
      throw new Error("Image preprocessing failed");
    }
  }

  /**
   * Extract text from image using OCR
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} - OCR result with text and confidence
   */
  async extractTextFromImage(imagePath) {
    try {
      console.log("📖 Extracting text from image...");

      // Initialize worker if needed
      const worker = await this.initializeWorker();

      // Preprocess image for better results
      const processedImage = await this.preprocessImage(imagePath);

      // Recognize text
      const result = await worker.recognize(processedImage);

      const text = result.data.text || "";
      const confidence = result.data.confidence || 0;

      console.log(`✅ Text extraction complete (Confidence: ${confidence.toFixed(2)}%)`);

      return {
        success: true,
        text: text.trim(),
        confidence,
        lines: this.extractLines(text)
      };
    } catch (error) {
      console.error("Error extracting text from image:", error);
      return {
        success: false,
        text: "",
        confidence: 0,
        error: "Failed to extract text from image"
      };
    }
  }

  /**
   * Extract individual lines from text
   * Useful for analyzing specific parts of the screenshot
   * @param {string} text - Full extracted text
   * @returns {Array} - Array of text lines
   */
  extractLines(text) {
    return text
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Search for specific keywords in extracted text
   * Helps identify sections like "UPI Reference", "Transaction ID", etc.
   * @param {string} text - Extracted text
   * @param {Array} keywords - Keywords to search for
   * @returns {Object} - Matches found with context
   */
  findKeywordContexts(text, keywords = []) {
    const defaultKeywords = ["utr", "reference", "txn", "transaction", "id", "ref no", "payment"];
    const searchKeywords = keywords.length > 0 ? keywords : defaultKeywords;

    const lines = this.extractLines(text);
    const matches = [];

    lines.forEach((line, index) => {
      searchKeywords.forEach(keyword => {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          matches.push({
            keyword,
            line,
            context: {
              before: lines[index - 1] || "",
              after: lines[index + 1] || ""
            },
            lineIndex: index
          });
        }
      });
    });

    return matches;
  }

  /**
   * Full pipeline: Process image and extract UTR
   * @param {string} filePath - Path to image file
   * @param {Object} file - Express file object
   * @returns {Promise<Object>} - Complete OCR and UTR extraction result
   */
  async processPaymentScreenshot(filePath, file) {
    try {
      console.log("\n🎬 Starting Payment Screenshot Processing Pipeline...");

      // Step 1: Validate file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          stage: "validation",
          error: validation.error
        };
      }

      // Step 2: Extract text from image
      const ocrResult = await this.extractTextFromImage(filePath);
      if (!ocrResult.success) {
        return {
          success: false,
          stage: "ocr",
          error: ocrResult.error
        };
      }

      console.log("\n📝 Extracted Text:");
      console.log(ocrResult.text);

      // Step 3: Find keyword contexts
      const keywordContexts = this.findKeywordContexts(ocrResult.text);
      console.log("\n🔍 Keyword Contexts Found:");
      keywordContexts.forEach(ctx => {
        console.log(`  - "${ctx.keyword}" in: "${ctx.line}"`);
      });

      // Step 4: Try explicit UTR extraction first
      let utrResult = null;
      const explicitUtr = extractExplicitUtr(ocrResult.text);
      if (explicitUtr) {
        utrResult = {
          success: true,
          utr: explicitUtr,
          confidence: 98,
          method: "explicit",
          debugInfo: "Found explicitly labeled UTR"
        };
      } else {
        // Step 5: Fall back to pattern matching
        utrResult = extractUtr(ocrResult.text);
      }

      console.log("\n💰 UTR Extraction Result:");
      console.log(`  - Success: ${utrResult.success}`);
      if (utrResult.success) {
        console.log(`  - UTR: ${utrResult.utr}`);
        console.log(`  - Confidence: ${utrResult.confidence}%`);
        console.log(`  - Format: ${utrResult.format}`);
      }

      // Step 6: Compile final result
      const finalResult = {
        success: utrResult.success,
        stage: "complete",
        ocrData: {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          lineCount: ocrResult.lines.length
        },
        utrData: {
          found: utrResult.success,
          utr: utrResult.utr || null,
          confidence: utrResult.confidence || 0,
          format: utrResult.format || null,
          alternatives: utrResult.alternatives || [],
          method: utrResult.method || "pattern"
        },
        keywordContexts,
        processingTimestamp: new Date()
      };

      console.log("\n✅ Payment Screenshot Processing Complete!");
      return finalResult;
    } catch (error) {
      console.error("Error processing payment screenshot:", error);
      return {
        success: false,
        stage: "pipeline",
        error: error.message || "Failed to process screenshot"
      };
    }
  }

  /**
   * Clean up uploaded file
   * @param {string} filePath - Path to file to delete
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`✅ Deleted file: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }

  /**
   * Generate receipt example image (for testing/documentation)
   * Shows where UTR appears in payment screenshots
   */
  async generateReceiptReference() {
    return {
      title: "Sample UPI Payment Receipt",
      utrLocation: "Usually appears at the bottom or in a dedicated 'Reference' section",
      commonLabels: ["UTR:", "Reference No:", "Transaction ID:", "Ref:", "TXN ID:"],
      example: {
        utr: "320524N00124567",
        format: "16-character alphanumeric code",
        appearance: "Typically in smaller font at bottom of receipt"
      }
    };
  }
}

// Create singleton instance
export default new OcrService();