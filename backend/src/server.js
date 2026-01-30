import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import connectDB from "./config/db.js";

// 🔐 AUTH ROUTES
import authRoutes from "./routes/authRoutes.js";

// 👚 PRODUCT ROUTES
import sareeRoutes from "./routes/sareeRoutes.js";
import productRoutes from "./routes/productRoutes.js";

// 📋 ORDER & PAYMENT ROUTES
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// 👥 USER & PROFILE ROUTES
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

// 🛒 CART ROUTES
import cartRoutes from "./routes/cartRoutes.js";

// 📨 CONTACT & COMMUNICATION ROUTES
import contactRoutes from "./routes/contactRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// ⚠️ ISSUE REPORT ROUTES
import issueRoutes from "./routes/issueRoutes.js";

// ✅ NEW: UPI PAYMENT ROUTES
import upiPaymentRoutes from "./routes/upiPaymentRoutes.js";

// ✅ OLD: UPI CONFIGURATION ROUTES (existing)
import upiRoutes from "./routes/upiRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ======================================
// MIDDLEWARE CONFIGURATION
// ======================================

// ✅ CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ Static file serving for uploads
app.use("/uploads", express.static("uploads"));

// ======================================
// CREATE UPLOAD DIRECTORY ON STARTUP
// ======================================

const initializeUploadDirectories = async () => {
  try {
    const uploadDir = process.env.UPI_UPLOAD_DIR || "./uploads/upi-payments";
    await fs.mkdir(uploadDir, { recursive: true });
    console.log(`✅ Upload directory created/verified: ${uploadDir}`);
  } catch (error) {
    console.error("❌ Error creating upload directory:", error);
  }
};

// Call on startup
initializeUploadDirectories();

// ======================================
// BASE ROUTE
// ======================================

app.get("/", (req, res) => {
  res.json({ 
    message: "Backend is running 🚀",
    status: "operational",
    timestamp: new Date().toISOString()
  });
});

// ======================================
// API ROUTES
// ======================================

// 🔐 Authentication Routes
app.use("/api/auth", authRoutes);

// 👚 Product Routes
app.use("/api/sarees", sareeRoutes);
app.use("/api/products", productRoutes);

// 📋 Order Routes
app.use("/api/orders", orderRoutes);

// 💳 Payment Routes
app.use("/api/payments", paymentRoutes);

// 👥 User Management Routes
app.use("/api/users", userRoutes);

// 👤 Profile Routes
app.use("/api/profile", profileRoutes);

// 🛒 Cart Routes
app.use("/api/cart", cartRoutes);

// 📨 Contact Routes
app.use("/api/contact", contactRoutes);

// 💬 Chat Routes
app.use("/api/chat", chatRoutes);

// ⚠️ Issue Report Routes
app.use("/api/issues", issueRoutes);

// ✅ NEW: UPI PAYMENT ROUTES (Main payment processing)
app.use("/api/upi-payments", upiPaymentRoutes);

// ✅ OLD: UPI Configuration Routes (Admin setup)
app.use("/api/upi", upiRoutes);

// ======================================
// HEALTH CHECK ENDPOINT
// ======================================

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ======================================
// 404 ERROR HANDLER
// ======================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ======================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// ======================================

app.use((err, req, res, next) => {
  console.error("❌ Error:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Multer file upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File size exceeds limit"
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded"
      });
    }
  }

  // Invalid JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body"
    });
  }

  // Mongoose errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired"
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { error: err.stack })
  });
});

// ======================================
// START SERVER
// ======================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║         Siri Taste Craft Backend Server              ║
╠═══════════════════════════════════════════════════════╣
║ 🚀 Server running on port ${PORT}                    
║ 🌍 Environment: ${NODE_ENV}                           
║ 📅 Started: ${new Date().toLocaleString()}           
║ ✅ Database: Connected                                
║ ✅ UPI Payment System: Active                         
║ ✅ File Upload: Enabled                               
╚═══════════════════════════════════════════════════════╝
  `);
});

// ======================================
// GRACEFUL SHUTDOWN
// ======================================

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("SIGINT", () => {
  console.log("\n\n📛 Server shutting down gracefully...");
  process.exit(0);
});

export default app;