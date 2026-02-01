import mongoose from "mongoose";
import Order from "../models/Order.js";
import Saree from "../models/Saree.js";
import Address from "../models/Address.js";

// 🛒 Place Order - Updated with address & payment method
export const placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, addressId, newAddress } = req.body;
    const userId = req.user.id;

    // ✅ Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "No items in order"
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid total amount"
      });
    }

    // ✅ Validate payment method
    if (!paymentMethod || !["COD", "UPI"].includes(paymentMethod)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid payment method. Must be 'COD' or 'UPI'"
      });
    }

    // ✅ Validate address
    let deliveryAddress;

    if (newAddress) {
      // Validate new address fields
      const { fullName, mobileNumber, houseFlat, streetArea, city, state, pincode, addressType } = newAddress;
      
      if (!fullName || !mobileNumber || !houseFlat || !streetArea || !city || !state || !pincode || !addressType) {
        return res.status(400).json({
          success: false,
          message: "All address fields are required"
        });
      }

      if (!/^\d{10}$/.test(mobileNumber)) {
        return res.status(400).json({
          success: false,
          message: "Mobile number must be 10 digits"
        });
      }

      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({
          success: false,
          message: "Pincode must be 6 digits"
        });
      }

      if (!["Home", "Work"].includes(addressType)) {
        return res.status(400).json({
          success: false,
          message: "Address type must be 'Home' or 'Work'"
        });
      }

      deliveryAddress = newAddress;
    } else if (addressId) {
      // Use existing address
      const savedAddress = await Address.findOne({
        _id: addressId,
        user: userId
      });

      if (!savedAddress) {
        return res.status(404).json({
          success: false,
          message: "Address not found"
        });
      }

      deliveryAddress = {
        fullName: savedAddress.fullName,
        mobileNumber: savedAddress.mobileNumber,
        houseFlat: savedAddress.houseFlat,
        streetArea: savedAddress.streetArea,
        city: savedAddress.city,
        state: savedAddress.state,
        pincode: savedAddress.pincode,
        addressType: savedAddress.addressType
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required"
      });
    }

    // ✅ Process each item and validate product IDs
    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of items) {
      // Validate item has required fields
      if (!item.product || !item.quantity) {
        return res.status(400).json({ 
          success: false,
          message: "Each item must have product ID and quantity"
        });
      }

      // ✅ Validate and convert product ID to MongoDB ObjectId
      let productId;
      
      if (mongoose.Types.ObjectId.isValid(item.product)) {
        productId = new mongoose.Types.ObjectId(item.product);
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID format: "${item.product}"`
        });
      }

      // ✅ Use Saree model
      const saree = await Saree.findById(productId);

      if (!saree) {
        return res.status(404).json({
          success: false,
          message: `Saree not found with ID: ${item.product}`
        });
      }

      // Check stock availability
      if (saree.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${saree.name}". Available: ${saree.stock}, Requested: ${item.quantity}`
        });
      }

      // ✅ Deduct stock from saree
      saree.stock = (saree.stock || 0) - item.quantity;
      await saree.save();

      // Build processed item with correct data
      processedItems.push({
        product: productId,
        name: item.name || saree.name,
        quantity: item.quantity,
        price: item.price || saree.price
      });

      // Calculate total
      calculatedTotal += (item.price || saree.price) * item.quantity;
    }

    // ✅ Determine payment and order status based on payment method
    let paymentStatus = "COD_PENDING";
    let orderStatus = "PLACED";

    if (paymentMethod === "UPI") {
      paymentStatus = "PENDING";
    } else if (paymentMethod === "COD") {
      paymentStatus = "COD_PENDING";
      orderStatus = "PLACED";
    }

    // ✅ Create order with address and payment method
    const order = await Order.create({
      user: new mongoose.Types.ObjectId(userId),
      items: processedItems,
      totalAmount: calculatedTotal || totalAmount,
      address: deliveryAddress,
      paymentMethod,
      orderStatus,
      paymentStatus
    });

    console.log("✅ Order created successfully:", order._id);

    // ✅ If new address was provided, save it to user's addresses
    if (newAddress) {
      const existingAddresses = await Address.find({ user: userId });
      const isDefault = existingAddresses.length === 0;

      const savedAddr = new Address({
        user: userId,
        ...newAddress,
        isDefault
      });

      await savedAddr.save();
      console.log("✅ Address saved for future orders");
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      _id: order._id,
      order
    });

  } catch (error) {
    console.error("❌ Order creation error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: "Validation failed: " + messages.join(", "),
        errors: messages
      });
    }

    return res.status(500).json({ 
      success: false,
      message: error.message || "Error creating order"
    });
  }
};

// 👤 Get User's Orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders: orders || []
    });
  } catch (error) {
    console.error("❌ Get orders error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching orders",
      orders: []
    });
  }
};

// 🛠 Admin: Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders: orders || [],
      total: orders.length
    });
  } catch (error) {
    console.error("❌ Get all orders error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching orders",
      orders: []
    });
  }
};

// ✅ Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentReference } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Update payment status
    order.paymentStatus = status === "VERIFIED" ? "VERIFIED" : "REJECTED";
    if (paymentReference) order.paymentReference = paymentReference;
    if (status === "VERIFIED") {
      order.paymentVerifiedAt = new Date();
      order.orderStatus = "CONFIRMED";
    }
    
    await order.save();

    return res.json({
      success: true,
      message: `Payment ${status}`,
      order
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error verifying payment"
    });
  }
};

// 📝 Get Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name price image");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("❌ Get order details error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching order details"
    });
  }
};

// 📋 Get Order By ID (alias for getOrderDetails)
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name price image");

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // ✅ Verify ownership: user can only see their own orders
    if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized to view this order" 
      });
    }

    return res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("❌ Get order by ID error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching order"
    });
  }
};

// ✏️ Update Order Status (Admin Only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    // ✅ Validate status
    const validStatuses = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus, updatedAt: new Date() },
      { new: true }
    ).populate("user", "name email").populate("items.product", "name price");

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    console.log(`✅ Order ${orderId} status updated to: ${orderStatus}`);

    return res.json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
      order
    });
  } catch (error) {
    console.error("❌ Update order status error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error updating order status"
    });
  }
};

// ❌ Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // ✅ Verify ownership: user can only cancel their own orders
    if (order.user.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized to cancel this order" 
      });
    }

    // ✅ Check if order can be cancelled
    const cancellableStatuses = ["PLACED", "CONFIRMED"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.orderStatus}`
      });
    }

    // ✅ Restore stock for cancelled items
    for (const item of order.items) {
      const saree = await Saree.findById(item.product);
      if (saree) {
        saree.stock = (saree.stock || 0) + item.quantity;
        await saree.save();
      }
    }

    // ✅ Update order status to cancelled
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: "CANCELLED",
        updatedAt: new Date()
      },
      { new: true }
    ).populate("user", "name email").populate("items.product", "name price");

    console.log(`✅ Order ${orderId} cancelled successfully`);

    return res.json({
      success: true,
      message: "Order cancelled successfully and stock restored",
      order: updatedOrder
    });
  } catch (error) {
    console.error("❌ Cancel order error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error cancelling order"
    });
  }
};