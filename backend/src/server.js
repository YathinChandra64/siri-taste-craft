import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import sareeRoutes from "./routes/sareeRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// ✅ NEW ROUTES
import chatRoutes from "./routes/chatRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import upiRoutes from "./routes/upiRoutes.js";

import Notification from "./models/Notification.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Enable CORS with credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Base route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

// 🔐 Auth routes
app.use("/api/auth", authRoutes);

// 👚 Saree routes
app.use("/api/sarees", sareeRoutes);

// 📦 Product routes
app.use("/api/products", productRoutes);

// 📋 Order routes
app.use("/api/orders", orderRoutes);

// 👥 User management routes
app.use("/api/users", userRoutes);

// 📨 Contact routes
app.use("/api/contact", contactRoutes);

// 🛒 Cart routes
app.use("/api/cart", cartRoutes);

// 👤 Profile routes
app.use("/api/profile", profileRoutes);

// 💳 Payment routes
app.use("/api/payments", paymentRoutes);

// ✅ NEW: Chat routes
app.use("/api/chat", chatRoutes);

// ✅ NEW: Issue report routes
app.use("/api/issues", issueRoutes);

// ✅ NEW: UPI configuration routes
app.use("/api/upi", upiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// 🚀 Start server (ALWAYS LAST)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});