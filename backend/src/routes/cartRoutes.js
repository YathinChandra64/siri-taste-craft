import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  clearCart
} from "../controllers/cartController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/", addToCart);
router.get("/", getCart);
router.delete("/:cartItemId", removeFromCart);
router.put("/:cartItemId", updateCartQuantity);
router.delete("/clear/all", clearCart);

export default router;