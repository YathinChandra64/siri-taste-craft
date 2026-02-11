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
import reviewRoutes from "./routes/reviewRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";

// 📋 ORDER & PAYMENT ROUTES
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// 👥 USER & PROFILE ROUTES
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

// 📍 ADDRESS ROUTES
import addressRoutes from "./routes/addressRoutes.js";

// 🛒 CART ROUTES
import cartRoutes from "./routes/cartRoutes.js";

// 📨 CONTACT & COMMUNICATION ROUTES
import contactRoutes from "./routes/contactRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// ⚠️ ISSUE REPORT ROUTES
import issueRoutes from "./routes/issueRoutes.js";

// 💰 UPI PAYMENT ROUTES
import upiPaymentRoutes from "./routes/upiPaymentRoutes.js";
import upiRoutes from "./routes/upiRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ======================================
// MIDDLEWARE CONFIGURATION
// ======================================

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:8080",
      "http://localhost:3000",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:3000"
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
    process.exit(1);
  }
};

await initializeUploadDirectories();

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

// 🔐 Authentication
app.use("/api/auth", authRoutes);

// 👚 Products & Sarees
app.use("/api/products", productRoutes);
app.use("/api/sarees", recommendationRoutes);
app.use("/api/sarees", reviewRoutes);
app.use("/api/sarees", sareeRoutes);

// 📋 Orders
app.use("/api/orders", orderRoutes);

// 💳 Payments
app.use("/api/payments", paymentRoutes);
app.use("/api/upi-payments", upiPaymentRoutes);
app.use("/api/upi", upiRoutes);

// 👥 Users & Profile
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);

// 📍 Addresses
app.use("/api/addresses", addressRoutes);

// 🛒 Cart
app.use("/api/cart", cartRoutes);

// 📨 Communication
app.use("/api/contact", contactRoutes);
app.use("/api/chat", chatRoutes);

// ⚠️ Issues
app.use("/api/issues", issueRoutes);

// ======================================
// ERROR HANDLING
// ======================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : undefined
  });
});

// ======================================
// SERVER STARTUP
// ======================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   🚀 BACKEND SERVER STARTED 🚀     ║
║   Port: ${PORT}
║   Environment: ${process.env.NODE_ENV || "development"}
╚════════════════════════════════════╝
  `);

  console.log("✅ Database connected");
  console.log("✅ Upload directories initialized");
  console.log(`📡 API running on http://localhost:${PORT}`);
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("📭 SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
  });
});

export default app;