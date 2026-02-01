import mongoose from "mongoose";
import Address from "../models/Address.js";

// ✅ Add New Address
export const addAddress = async (req, res) => {
  try {
    const { fullName, mobileNumber, houseFlat, streetArea, city, state, pincode, addressType } = req.body;
    const userId = req.user.id;

    // Validation
    if (!fullName || !mobileNumber || !houseFlat || !streetArea || !city || !state || !pincode || !addressType) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required"
      });
    }

    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be 10 digits"
      });
    }

    // Validate pincode (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must be 6 digits"
      });
    }

    // Validate address type
    if (!["Home", "Work"].includes(addressType)) {
      return res.status(400).json({
        success: false,
        message: "Address type must be 'Home' or 'Work'"
      });
    }

    // Check if this is the first address (make it default)
    const existingAddresses = await Address.find({ user: userId });
    const isDefault = existingAddresses.length === 0;

    // If marking as default, unset other defaults
    if (isDefault) {
      await Address.updateMany(
        { user: userId },
        { isDefault: false }
      );
    }

    const address = new Address({
      user: userId,
      fullName,
      mobileNumber,
      houseFlat,
      streetArea,
      city,
      state,
      pincode,
      addressType,
      isDefault
    });

    await address.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      address
    });
  } catch (error) {
    console.error("❌ Add address error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error adding address"
    });
  }
};

// ✅ Get All User Addresses
export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });

    return res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error("❌ Get addresses error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching addresses",
      addresses: []
    });
  }
};

// ✅ Get Single Address
export const getAddressById = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID"
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      user: userId
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    return res.json({
      success: true,
      address
    });
  } catch (error) {
    console.error("❌ Get address error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching address"
    });
  }
};

// ✅ Update Address
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { fullName, mobileNumber, houseFlat, streetArea, city, state, pincode, addressType } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID"
      });
    }

    // Validate inputs if provided
    if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be 10 digits"
      });
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must be 6 digits"
      });
    }

    if (addressType && !["Home", "Work"].includes(addressType)) {
      return res.status(400).json({
        success: false,
        message: "Address type must be 'Home' or 'Work'"
      });
    }

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, user: userId },
      {
        fullName,
        mobileNumber,
        houseFlat,
        streetArea,
        city,
        state,
        pincode,
        addressType
      },
      { new: true, runValidators: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    return res.json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress
    });
  } catch (error) {
    console.error("❌ Update address error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating address"
    });
  }
};

// ✅ Delete Address
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID"
      });
    }

    const address = await Address.findOneAndDelete({
      _id: addressId,
      user: userId
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    // If deleted address was default, make the first remaining address default
    if (address.isDefault) {
      const firstAddress = await Address.findOne({ user: userId });
      if (firstAddress) {
        await Address.updateOne(
          { _id: firstAddress._id },
          { isDefault: true }
        );
      }
    }

    return res.json({
      success: true,
      message: "Address deleted successfully"
    });
  } catch (error) {
    console.error("❌ Delete address error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting address"
    });
  }
};

// ✅ Set Default Address
export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID"
      });
    }

    // Unset all other default addresses
    await Address.updateMany(
      { user: userId },
      { isDefault: false }
    );

    // Set this address as default
    const defaultAddress = await Address.findOneAndUpdate(
      { _id: addressId, user: userId },
      { isDefault: true },
      { new: true }
    );

    if (!defaultAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    return res.json({
      success: true,
      message: "Default address updated successfully",
      address: defaultAddress
    });
  } catch (error) {
    console.error("❌ Set default address error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error setting default address"
    });
  }
};