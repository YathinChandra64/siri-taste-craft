import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // ✅ NEW

dotenv.config();
connectDB();

const app = express();

// ✅ CORS with credentials enabled
app.use(cors({
  origin: "http://localhost:8080",
  credentials: true
}));

app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

// 🔐 Auth routes
app.use("/api/auth", authRoutes);

// 📦 Product routes
app.use("/api/products", productRoutes);

// 📋 Order routes
app.use("/api/orders", orderRoutes);

// 👥 User management routes (Admin only)
app.use("/api/users", userRoutes); // ✅ NEW

// 🚀 Start server (ALWAYS LAST)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});