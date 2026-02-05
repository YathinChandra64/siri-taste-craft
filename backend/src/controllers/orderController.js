import mongoose from "mongoose";
import Order from "../models/Order.js";
import Saree from "../models/Saree.js";
import Address from "../models/Address.js";

// 🛒 Place Order - FIXED VERSION
export const placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, addressId, newAddress } = req.body;
    const userId = req.user.id;

    console.log("📤 placeOrder called with:", {
      itemsCount: items?.length,
      totalAmount,
      paymentMethod,
      addressId,
      newAddressProvided: !!newAddress,
      userId,
      itemsDetail: items
    });

    // ✅ Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("❌ No items provided");
      return res.status(400).json({ 
        success: false,
        message: "No items in order"
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      console.error("❌ Invalid total amount:", totalAmount);
      return res.status(400).json({ 
        success: false,
        message: "Invalid total amount"
      });
    }

    // ✅ Validate payment method
    if (!paymentMethod || !["COD", "UPI"].includes(paymentMethod)) {
      console.error("❌ Invalid payment method:", paymentMethod);
      return res.status(400).json({ 
        success: false,
        message: "Invalid payment method. Must be 'COD' or 'UPI'"
      });
    }

    // ✅ Address handling - REQUIRED for COD, OPTIONAL for UPI
    let deliveryAddress = null;

    if (paymentMethod === "COD") {
      // COD requires address
      if (newAddress) {
        // Validate new address fields
        const { fullName, mobileNumber, houseFlat, streetArea, city, state, pincode, addressType } = newAddress;
        
        if (!fullName || !mobileNumber || !houseFlat || !streetArea || !city || !state || !pincode || !addressType) {
          console.error("❌ Missing address fields");
          return res.status(400).json({
            success: false,
            message: "All address fields are required for COD"
          });
        }

        if (!/^\d{10}$/.test(mobileNumber)) {
          console.error("❌ Invalid mobile number:", mobileNumber);
          return res.status(400).json({
            success: false,
            message: "Mobile number must be 10 digits"
          });
        }

        if (!/^\d{6}$/.test(pincode)) {
          console.error("❌ Invalid pincode:", pincode);
          return res.status(400).json({
            success: false,
            message: "Pincode must be 6 digits"
          });
        }

        if (!["Home", "Work"].includes(addressType)) {
          console.error("❌ Invalid address type:", addressType);
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
          console.error("❌ Address not found:", addressId);
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
        // COD requires address
        console.error("❌ No address provided for COD");
        return res.status(400).json({
          success: false,
          message: "Delivery address is required for COD"
        });
      }
    } else if (paymentMethod === "UPI") {
      // UPI doesn't require address (customer can specify later)
      // But if provided, use it
      if (newAddress) {
        deliveryAddress = newAddress;
      } else if (addressId) {
        const savedAddress = await Address.findOne({
          _id: addressId,
          user: userId
        });
        if (savedAddress) {
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
        }
      }
      // For UPI: address is optional, so we continue even if null
    }

    // ✅ Process each item and validate product IDs
    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of items) {
      console.log("Processing item:", item);
      
      // Validate item has required fields
      if (!item.product || !item.quantity) {
        console.error("❌ Item missing product or quantity:", item);
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
        console.error("❌ Invalid product ID format:", item.product);
        return res.status(400).json({
          success: false,
          message: `Invalid product ID format: "${item.product}"`
        });
      }

      // ✅ Use Saree model
      const saree = await Saree.findById(productId);

      if (!saree) {
        console.error("❌ Saree not found:", item.product);
        return res.status(404).json({
          success: false,
          message: `Saree not found with ID: ${item.product}`
        });
      }

      // Check stock availability
      if (saree.stock < item.quantity) {
        console.error("❌ Insufficient stock for", saree.name);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${saree.name}". Available: ${saree.stock}, Requested: ${item.quantity}`
        });
      }

      // ✅ Deduct stock from saree
      saree.stock = (saree.stock || 0) - item.quantity;
      await saree.save();
      console.log("✅ Stock updated for:", saree.name);

      // Build processed item with correct data
      processedItems.push({
        product: productId,
        name: item.name || saree.name,
        quantity: item.quantity,
        price: item.price || saree.price
      });

      // Calculate total
      const itemPrice = item.price || saree.price;
      calculatedTotal += itemPrice * item.quantity;
    }

    console.log("✅ All items processed. Calculated total:", calculatedTotal);

    // ✅ Determine payment and order status based on payment method
    let paymentStatus = "COD_PENDING";
    let orderStatus = "PLACED";

    if (paymentMethod === "UPI") {
      paymentStatus = "PENDING";
      orderStatus = "PENDING_PAYMENT";
    } else if (paymentMethod === "COD") {
      paymentStatus = "COD_PENDING";
      orderStatus = "PLACED";
    }

    // ✅ Create order with address (optional for UPI) and payment method
    const orderData = {
      user: new mongoose.Types.ObjectId(userId),
      items: processedItems,
      totalAmount: calculatedTotal || totalAmount,
      paymentMethod,
      orderStatus,
      paymentStatus
    };

    // Only add address if it exists (required for COD, optional for UPI)
    if (deliveryAddress) {
      orderData.address = deliveryAddress;
    }

    console.log("📦 Creating order with data:", JSON.stringify(orderData, null, 2));

    const order = await Order.create(orderData);

    console.log("✅ Order created successfully:", {
      orderId: order._id,
      paymentMethod: order.paymentMethod,
      hasAddress: !!order.address
    });

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
      message: `Order placed successfully via ${paymentMethod}`,
      _id: order._id,
      orderId: order._id,
      id: order._id,
      paymentMethod: order.paymentMethod,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount
    });

  } catch (error) {
    console.error("❌ Error placing order:", error);
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Error placing order",
      error: process.env.NODE_ENV === "development" ? error : undefined
    });
  }
};

// 📋 Get all orders for current user
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: userId })
      .populate("user", "name email")
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      orders
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Error fetching orders"
    });
  }
};

// 🔍 Get order details
export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, user: userId })
      .populate("user", "name email phone")
      .populate("items.product", "name price image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order details retrieved successfully",
      order
    });
  } catch (error) {
    console.error("❌ Error fetching order details:", error);
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Error fetching order details"
    });
  }
};

// 👨‍💼 Get all orders (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All orders retrieved successfully",
      totalOrders: orders.length,
      orders
    });
  } catch (error) {
    console.error("❌ Error fetching all orders:", error);
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Error fetching all orders"
    });
  }
};

// Get single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("user", "name email phone")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      order
    });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Error fetching order"
    });
  }
};

// 📝 Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: "Order status is required"
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Error updating order status"
    });
  }
};

// ❌ Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.orderStatus === "CANCELLED" || order.orderStatus === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${order.orderStatus} order`
      });
    }

    order.orderStatus = "CANCELLED";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Error cancelling order"
    });
  }
};

// ✅ Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "Payment status is required"
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { 
        paymentStatus,
        orderStatus: paymentStatus === "VERIFIED" ? "CONFIRMED" : "PENDING_PAYMENT"
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order
    });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Error verifying payment"
    });
  }
};