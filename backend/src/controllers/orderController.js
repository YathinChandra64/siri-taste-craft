import mongoose from "mongoose";
import Order from "../models/Order.js";
import Saree from "../models/Saree.js";
import Address from "../models/Address.js";

// 🛒 Place Order - FIXED VERSION
export const placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, addressId, newAddress } = req.body;
    // ✅ FIXED: Use _id instead of id
    const userId = req.user._id || req.user.id;

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
    if (!paymentMethod || !["COD", "UPI", "RAZORPAY"].includes(paymentMethod)) {
  return res.status(400).json({ 
    success: false,
    message: "Invalid payment method. Must be 'COD', 'UPI', or 'RAZORPAY'"
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

      // ✅ Check stock availability - Handle both global stock and color variants
      let availableStock = 0;
      let hasColorVariants = saree.colorVariants && saree.colorVariants.length > 0;

      if (hasColorVariants) {
        // If color variants exist, sum up variant stocks
        availableStock = saree.colorVariants.reduce((total, variant) => total + (variant.stock || 0), 0);
        console.log(`📊 Saree has ${saree.colorVariants.length} color variants. Total stock: ${availableStock}`);
      } else {
        // Otherwise use main stock field
        availableStock = saree.stock || 0;
        console.log(`📊 Using main stock field. Available: ${availableStock}`);
      }

      if (availableStock < item.quantity) {
        console.error("❌ Insufficient stock for", saree.name, `- Need: ${item.quantity}, Available: ${availableStock}`);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${saree.name}". Available: ${availableStock}, Requested: ${item.quantity}`
        });
      }

      // ✅ Deduct stock from saree
      if (hasColorVariants) {
        // Deduct from color variants (from first variant with stock)
        let remainingQty = item.quantity;
        for (let variant of saree.colorVariants) {
          if (remainingQty <= 0) break;
          
          const deductQty = Math.min(remainingQty, variant.stock || 0);
          variant.stock = (variant.stock || 0) - deductQty;
          remainingQty -= deductQty;
          console.log(`✅ Deducted ${deductQty} from variant "${variant.color}". Remaining: ${variant.stock}`);
        }
      } else {
        // Deduct from main stock
        saree.stock = (saree.stock || 0) - item.quantity;
        console.log(`✅ Deducted ${item.quantity} from main stock. Remaining: ${saree.stock}`);
      }

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
} else if (paymentMethod === "RAZORPAY") {
  // Razorpay doesn't use paymentStatus, uses orderStatus instead
  orderStatus = "CREATED";
  paymentStatus = "PENDING";  // Set a default
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
    // ✅ FIXED: Use _id instead of id
    const userId = req.user._id || req.user.id;

    console.log("📋 Fetching orders for user:", userId);

    // ✅ Try to find orders using the correct 'user' field
    let orders = await Order.find({ user: userId })
      .populate("user", "name email")
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} orders with 'user' field`);

    // ✅ Fallback: If no orders found, try legacy 'userId' field
    // (for backward compatibility with old orders)
    if (orders.length === 0) {
      console.log("⚠️ No orders found with 'user' field, trying legacy 'userId' field...");
      orders = await Order.find({ userId: userId })
        .populate("user", "name email")
        .populate("items.product", "name price image")
        .populate("items.sareeId", "name price image")
        .sort({ createdAt: -1 });
      console.log(`✅ Found ${orders.length} orders with legacy 'userId' field`);
    }

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      orders
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Error fetching orders",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// 🔍 Get order details
export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ FIXED: Use _id instead of id
    const userId = req.user._id || req.user.id;

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
    // ✅ FIXED: Use _id instead of id
    const userId = req.user._id || req.user.id;

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

// 📊 Get order statistics (Admin)
export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: "PENDING_PAYMENT" });
    const placedOrders = await Order.countDocuments({ orderStatus: "PLACED" });
    const confirmedOrders = await Order.countDocuments({ orderStatus: "CONFIRMED" });
    const processingOrders = await Order.countDocuments({ orderStatus: "PROCESSING" });
    const shippedOrders = await Order.countDocuments({ orderStatus: "SHIPPED" });
    const deliveredOrders = await Order.countDocuments({ orderStatus: "DELIVERED" });
    const cancelledOrders = await Order.countDocuments({ orderStatus: "CANCELLED" });

    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: { $in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    return res.status(200).json({
      success: true,
      message: "Order statistics retrieved successfully",
      stats: {
        totalOrders,
        pendingOrders,
        placedOrders,
        confirmedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("❌ Error fetching order stats:", error);
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Error fetching order statistics"
    });
  }
};

export const updateOrderStatusWithTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, description, shipper, trackingNumber, trackingUrl, location, notes } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: "Order status is required"
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update status and add to timeline
    await order.updateStatus(orderStatus, {
      description: description,
      location: location,
      shipper: shipper,
      trackingNumber: trackingNumber,
      trackingUrl: trackingUrl,
      notes: notes
    });

    // Update shipping info if provided
    if (shipper || trackingNumber || trackingUrl) {
      order.shipping = {
        ...order.shipping,
        shipper: shipper || order.shipping?.shipper,
        trackingNumber: trackingNumber || order.shipping?.trackingNumber,
        trackingUrl: trackingUrl || order.shipping?.trackingUrl
      };
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: order.populate("user", "name email phone").populate("items.product", "name price image")
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error updating order status"
    });
  }
};

// ✅ GET ORDER WITH TIMELINE
export const getOrderWithTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const order = await Order.findOne({ _id: id })
      .populate("user", "name email phone")
      .populate("items.product", "name price image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // For customers, only return their own orders
    if (req.user.role !== "admin" && order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this order"
      });
    }

    // Transform timeline for frontend
    const timeline = order.orderTimeline.map(entry => ({
      status: entry.status,
      description: entry.description,
      timestamp: entry.timestamp,
      location: entry.location,
      shipper: entry.shipper,
      trackingNumber: entry.trackingNumber,
      trackingUrl: entry.trackingUrl,
      notes: entry.notes
    }));

    return res.status(200).json({
      success: true,
      message: "Order retrieved successfully with timeline",
      order: {
        ...order.toObject(),
        timeline: timeline.reverse() // Most recent first
      }
    });
  } catch (error) {
    console.error("❌ Error fetching order with timeline:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error fetching order"
    });
  }
};

// ✅ UPDATE SHIPPING INFO
export const updateShippingInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { shipper, trackingNumber, trackingUrl, estimatedDeliveryDate } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update shipping information
    order.shipping = {
      shipper: shipper || order.shipping?.shipper,
      trackingNumber: trackingNumber || order.shipping?.trackingNumber,
      trackingUrl: trackingUrl || order.shipping?.trackingUrl,
      estimatedDeliveryDate: estimatedDeliveryDate || order.shipping?.estimatedDeliveryDate,
      actualDeliveryDate: order.shipping?.actualDeliveryDate
    };

    // Add timeline entry for shipping info update
    if (shipper || trackingNumber) {
      order.addTimelineEntry(
        "SHIPPED",
        `Order shipped via ${shipper || "courier"}. Tracking: ${trackingNumber || "N/A"}`,
        {
          shipper: shipper,
          trackingNumber: trackingNumber,
          trackingUrl: trackingUrl
        }
      );
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Shipping information updated successfully",
      order: await order.populate("user", "name email phone").populate("items.product", "name price image")
    });
  } catch (error) {
    console.error("❌ Error updating shipping info:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error updating shipping information"
    });
  }
};

// ✅ GET CUSTOMER ORDER TRACKING
export const getOrderTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const order = await Order.findOne({ _id: id, user: userId })
      .select("_id orderStatus orderTimeline shipping items totalAmount user createdAt");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Format tracking data for display
    const stages = [
      {
        name: "Order Placed",
        status: "completed",
        timestamp: order.createdAt,
        icon: "📦"
      },
      {
        name: "Confirmed",
        status: ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) ? "completed" : "pending",
        timestamp: order.orderTimeline.find(t => t.status === "CONFIRMED")?.timestamp,
        icon: "✓"
      },
      {
        name: "Packed",
        status: ["PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) ? "completed" : "pending",
        timestamp: order.orderTimeline.find(t => t.status === "PACKED")?.timestamp,
        icon: "📮"
      },
      {
        name: "Shipped",
        status: ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) ? "completed" : "pending",
        timestamp: order.orderTimeline.find(t => t.status === "SHIPPED")?.timestamp,
        shipper: order.shipping?.shipper,
        trackingNumber: order.shipping?.trackingNumber,
        trackingUrl: order.shipping?.trackingUrl,
        icon: "🚚"
      },
      {
        name: "Out for Delivery",
        status: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) ? "completed" : "pending",
        timestamp: order.orderTimeline.find(t => t.status === "OUT_FOR_DELIVERY")?.timestamp,
        icon: "🏠"
      },
      {
        name: "Delivered",
        status: order.orderStatus === "DELIVERED" ? "completed" : "pending",
        timestamp: order.orderTimeline.find(t => t.status === "DELIVERED")?.timestamp,
        icon: "✓✓"
      }
    ];

    return res.status(200).json({
      success: true,
      message: "Order tracking information retrieved",
      tracking: {
        orderId: order._id,
        currentStatus: order.orderStatus,
        stages: stages.filter(s => s.status || s.timestamp),
        shipping: order.shipping,
        timeline: order.orderTimeline.reverse() // Most recent first
      }
    });
  } catch (error) {
    console.error("❌ Error fetching order tracking:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error fetching order tracking"
    });
  }
};

// ✅ BATCH UPDATE ORDER STATUS (For admin bulk operations)
export const batchUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, orderStatus, description } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderIds array is required"
      });
    }

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: "orderStatus is required"
      });
    }

    const updates = await Promise.all(
      orderIds.map(id =>
        Order.findByIdAndUpdate(
          id,
          {
            $set: { orderStatus },
            $push: {
              orderTimeline: {
                status: orderStatus,
                description: description || `Bulk updated to ${orderStatus}`,
                timestamp: new Date()
              }
            }
          },
          { new: true }
        )
      )
    );

    return res.status(200).json({
      success: true,
      message: `${updates.length} orders updated successfully`,
      updatedCount: updates.length
    });
  } catch (error) {
    console.error("❌ Error in batch update:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error updating orders"
    });
  }
};

// ✅ GET ORDER STATISTICS WITH STATUS BREAKDOWN
export const getEnhancedOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const paymentMethodBreakdown = await Order.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalRevenue = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const revenueByPaymentMethod = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] }
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: "Enhanced order statistics retrieved successfully",
      stats: {
        totalOrders,
        statusBreakdown: Object.fromEntries(
          statusBreakdown.map(s => [s._id, s.count])
        ),
        paymentMethodBreakdown,
        totalRevenue: totalRevenue[0]?.total || 0,
        revenueByPaymentMethod
      }
    });
  } catch (error) {
    console.error("❌ Error fetching enhanced stats:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error fetching statistics"
    });
  }
};