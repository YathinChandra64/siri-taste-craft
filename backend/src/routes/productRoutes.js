import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct
} from "../controllers/productController.js";

const router = express.Router();

router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);

export default router;
