import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ Check if authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ Check if JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // ✅ Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Ensure decoded token has required fields
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    // ✅ IMPORTANT: Make sure email is in the token
    if (!decoded.email) {
      console.warn("⚠️ Token missing email field. User ID:", decoded.id);
      return res.status(401).json({ message: "Token missing email - please login again" });
    }

    // ✅ Set user object with all necessary fields
    req.user = {
      id: decoded.id,
      email: decoded.email,  // ✅ Email is critical for contact queries
      role: decoded.role || "customer"
    };

    console.log("✅ Auth successful for user:", req.user.email);
    next();

  } catch (error) {
    // ✅ Better error messages for debugging
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// ✅ Admin-only middleware - with better error handling
export const adminOnly = (req, res, next) => {
  // ✅ Check if req.user exists (should be set by protect middleware)
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // ✅ Check if user has admin role
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

// ✅ Customer-only middleware
export const customerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Customer access required" });
  }

  next();
};