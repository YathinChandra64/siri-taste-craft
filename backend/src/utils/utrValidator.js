/**
 * UTR Validator Utility
 * Validates and extracts UTR (Unique Transaction Reference) from OCR text
 * Supports multiple formats: UPI UTRs, Bank transaction IDs, Reference numbers
 */

// UTR Pattern Definitions
const UTR_PATTERNS = {
  // Standard UPI UTR format: 16-digit alphanumeric
  upiStandard: /\b[A-Z0-9]{16}\b/g,
  
  // UPI Long format: 20-character alphanumeric
  upiLong: /\b[A-Za-z0-9]{20}\b/g,
  
  // Bank transaction ID: T-reference
  bankTransaction: /T-\d{12,15}/gi,
  
  // Common pattern: "UTR:" or "Ref:" followed by numbers
  explicitUtr: /(?:UTR|Ref|Reference|TXN|Transaction ID|Ref No)[\s:]*([A-Za-z0-9]{10,20})/gi,
  
  // NEFT/RTGS format
  neftRtgs: /\b\d{10,15}\b/g,
  
  // Google Pay, PhonePe specific format
  googlePayPattern: /[A-Z0-9]{16}/g,
  
  // Additional format with special characters
  alphanumericWithSpecial: /[A-Za-z0-9\-_\.]{10,20}/g
};

/**
 * Main UTR extraction function
 * @param {string} text - OCR extracted text
 * @returns {Object} - { success, utr, confidence, format, debugInfo }
 */
export const extractUtr = (text) => {
  if (!text || typeof text !== "string") {
    return {
      success: false,
      utr: null,
      confidence: 0,
      format: null,
      debugInfo: "Invalid text input"
    };
  }

  // Clean and normalize text
  const cleanText = normalizeText(text);
  const results = [];

  // Try each pattern
  for (const [format, pattern] of Object.entries(UTR_PATTERNS)) {
    const matches = cleanText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (isValidUtr(match)) {
          results.push({
            utr: match,
            format,
            confidence: calculateConfidence(match, format)
          });
        }
      });
    }
  }

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);

  if (results.length > 0) {
    // Return the best match
    const best = results[0];
    return {
      success: true,
      utr: best.utr.toUpperCase(),
      confidence: best.confidence,
      format: best.format,
      alternatives: results.slice(1, 3).map(r => r.utr),
      debugInfo: `Found ${results.length} potential UTR(s)`
    };
  }

  return {
    success: false,
    utr: null,
    confidence: 0,
    format: null,
    debugInfo: "No valid UTR found in text"
  };
};

/**
 * Validate individual UTR
 * @param {string} utr - UTR string to validate
 * @returns {boolean} - Is valid UTR
 */
export const isValidUtr = (utr) => {
  if (!utr || typeof utr !== "string") return false;

  const cleanUtr = utr.trim().toUpperCase();

  // Length validation: most UTRs are 16-20 chars
  if (cleanUtr.length < 10 || cleanUtr.length > 25) {
    return false;
  }

  // Must contain at least one letter or number
  if (!/[A-Z0-9]/.test(cleanUtr)) {
    return false;
  }

  // Should not be all numbers or all letters (usually mixed)
  const hasLetters = /[A-Z]/.test(cleanUtr);
  const hasNumbers = /[0-9]/.test(cleanUtr);

  // Allow 100% letters or 100% numbers for some formats
  // But standard UPI UTRs should have both
  if (cleanUtr.length >= 16) {
    // Standard length - prefer mixed content
    return true;
  }

  return hasLetters || hasNumbers;
};

/**
 * Calculate confidence score for extracted UTR
 * @param {string} utr - UTR string
 * @param {string} format - Detection format
 * @returns {number} - Confidence score 0-100
 */
export const calculateConfidence = (utr, format) => {
  let confidence = 50; // Base confidence

  const cleanUtr = utr.trim().toUpperCase();
  const length = cleanUtr.length;

  // Format-specific confidence boosters
  if (format === "upiStandard" && length === 16) {
    confidence = 95; // Exact UPI standard format
  } else if (format === "explicitUtr") {
    confidence = 98; // Explicitly labeled UTR
  } else if (format === "bankTransaction" && cleanUtr.startsWith("T-")) {
    confidence = 90;
  } else if (format === "upiLong" && length === 20) {
    confidence = 85;
  } else if (length === 16) {
    confidence = 80; // Likely UPI format
  } else if (length >= 10 && length <= 20) {
    confidence = 70; // Reasonable length for UTR
  }

  // Check for special patterns
  if (/[A-Z]{2,}[0-9]{2,}|[0-9]{2,}[A-Z]{2,}/.test(cleanUtr)) {
    confidence += 5; // Common pattern in UPI UTRs
  }

  // Check for dates or sequences (usually not UTRs)
  if (/\d{6,8}/.test(cleanUtr) && !format.includes("bank")) {
    confidence -= 10; // Might be date, reduce confidence
  }

  return Math.min(confidence, 100);
};

/**
 * Normalize text for better processing
 * @param {string} text - Raw OCR text
 * @returns {string} - Normalized text
 */
export const normalizeText = (text) => {
  if (!text) return "";

  return text
    .toUpperCase()
    .replace(/[^\w\s\-:.]/g, "") // Remove special chars except dash, colon, period
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};

/**
 * Extract multiple potential UTRs with alternatives
 * @param {string} text - OCR text
 * @returns {Array} - Array of potential UTRs sorted by confidence
 */
export const extractMultipleUtrs = (text) => {
  const cleanText = normalizeText(text);
  const candidates = [];

  for (const [format, pattern] of Object.entries(UTR_PATTERNS)) {
    const matches = cleanText.match(pattern) || [];
    matches.forEach(match => {
      if (isValidUtr(match)) {
        candidates.push({
          utr: match.toUpperCase(),
          format,
          confidence: calculateConfidence(match, format)
        });
      }
    });
  }

  // Remove duplicates and sort by confidence
  const unique = new Map();
  candidates.forEach(c => {
    const key = c.utr;
    if (!unique.has(key) || unique.get(key).confidence < c.confidence) {
      unique.set(key, c);
    }
  });

  return Array.from(unique.values()).sort((a, b) => b.confidence - a.confidence);
};

/**
 * Validate UTR format specifically for UPI
 * @param {string} utr - UTR to validate
 * @returns {Object} - Validation result
 */
export const validateUpiUtr = (utr) => {
  if (!utr || typeof utr !== "string") {
    return {
      isValid: false,
      reason: "Invalid input"
    };
  }

  const cleanUtr = utr.trim().toUpperCase();

  // Check length
  if (cleanUtr.length !== 16 && cleanUtr.length !== 20) {
    return {
      isValid: false,
      reason: `Invalid length: ${cleanUtr.length}. Expected 16 or 20 characters`
    };
  }

  // Check format (alphanumeric)
  if (!/^[A-Z0-9]+$/.test(cleanUtr)) {
    return {
      isValid: false,
      reason: "Contains invalid characters. Only alphanumeric allowed"
    };
  }

  // Check for common patterns
  if (/^0+$|^A+$|^1+$/.test(cleanUtr)) {
    return {
      isValid: false,
      reason: "Invalid pattern: repeated characters"
    };
  }

  return {
    isValid: true,
    reason: "Valid UPI UTR format"
  };
};

/**
 * Extract UTR from explicitly labeled references
 * Looks for patterns like "UTR: XXXXX" or "Ref No: XXXXX"
 * @param {string} text - OCR text
 * @returns {string|null} - Extracted UTR or null
 */
export const extractExplicitUtr = (text) => {
  const pattern = /(?:UTR|Ref|Reference|Ref\s*No|Ref\s*Number|Transaction ID)[:\s]*([A-Za-z0-9]{10,20})/gi;
  const matches = text.match(pattern);

  if (matches && matches.length > 0) {
    const utrPattern = /[A-Za-z0-9]{10,20}/;
    const extracted = matches[0].match(utrPattern);
    return extracted ? extracted[0].toUpperCase() : null;
  }

  return null;
};

/**
 * Sanitize UTR for database storage
 * @param {string} utr - Raw UTR
 * @returns {string} - Sanitized UTR
 */
export const sanitizeUtr = (utr) => {
  if (!utr || typeof utr !== "string") return "";

  return utr
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\-_]/g, "") // Keep only alphanumeric and dash/underscore
    .slice(0, 25); // Max 25 characters
};

/**
 * Format UTR for display
 * @param {string} utr - UTR string
 * @returns {string} - Formatted UTR
 */
export const formatUtrForDisplay = (utr) => {
  if (!utr) return "";

  const clean = sanitizeUtr(utr);

  // Format as XXXX-XXXX-XXXX-XXXX for 16-char UTRs
  if (clean.length === 16) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}-${clean.slice(12)}`;
  }

  return clean;
};

/**
 * Compare two UTRs (ignore formatting)
 * @param {string} utr1 - First UTR
 * @param {string} utr2 - Second UTR
 * @returns {boolean} - Are UTRs the same
 */
export const compareUtrs = (utr1, utr2) => {
  return sanitizeUtr(utr1) === sanitizeUtr(utr2);
};

export default {
  extractUtr,
  isValidUtr,
  validateUpiUtr,
  extractMultipleUtrs,
  extractExplicitUtr,
  sanitizeUtr,
  formatUtrForDisplay,
  compareUtrs,
  calculateConfidence,
  normalizeText
};