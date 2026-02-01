import express from "express";
import {
  addAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from "../controllers/addressController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All address routes require authentication
router.use(protect);

// ✅ Add new address
router.post("/", addAddress);

// ✅ Get all addresses for logged-in user
router.get("/", getUserAddresses);

// ✅ Get single address by ID
router.get("/:addressId", getAddressById);

// ✅ Update address
router.put("/:addressId", updateAddress);

// ✅ Delete address
router.delete("/:addressId", deleteAddress);

// ✅ Set as default
router.patch("/:addressId/default", setDefaultAddress);

export default router;