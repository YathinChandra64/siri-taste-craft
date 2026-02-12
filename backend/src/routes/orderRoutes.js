import express from 'express';
import Order from '../models/Order.js';
import Saree from '../models/Saree.js';
import Address from '../models/Address.js'; // ← ADD THIS
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create new order with stock validation
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount, addressId, newAddress, address } = req.body;
    const userId = req.user.id;

    console.log("📤 Order route received:", { itemsCount: items?.length, paymentMethod, hasAddress: !!address || !!newAddress || !!addressId });

    const stockErrors = [];

    // Validate and check stock
    for (const item of items) {
      // Frontend sends 'product', route expects 'sareeId'
      const productId = item.product || item.sareeId;
      
      if (!productId) {
        stockErrors.push(`Item missing product ID: ${item.name}`);
        continue;
      }

      console.log(`Checking stock for product: ${productId}`);
      const saree = await Saree.findById(productId);

      if (!saree) {
        console.error(`❌ Saree not found: ${productId}`);
        stockErrors.push(`Saree ${item.name} not found`);
        continue;
      }

      // ✅ Check stock availability - Handle both global stock and color variants
      let availableStock = 0;
      let selectedColor = item.selectedColor || item.color; // Accept both field names
      let hasColorVariants = saree.colorVariants && saree.colorVariants.length > 0;

      console.log(`📊 Checking saree: ${saree.name}, HasVariants: ${hasColorVariants}, RequestedColor: ${selectedColor}`);

      // LOGIC:
      // 1. If customer selected a color AND saree has variants
      //    → Check that specific color's stock
      // 2. If customer didn't select color BUT saree has variants
      //    → Customer MUST select a color (show error)
      // 3. If saree has NO variants
      //    → Use main stock (ignore color field)

      if (hasColorVariants) {
        // Saree has color variants
        
        if (!selectedColor) {
          // ❌ Customer didn't select a color, but saree requires it
          stockErrors.push(
            `${saree.name} has multiple colors available. Please select a color.`
          );
          continue;
        }

        // Find the selected color variant
        const variant = saree.colorVariants.find(v => v.color === selectedColor);

        if (!variant) {
          // ❌ Selected color doesn't exist
          const availableColors = saree.colorVariants.map(v => v.color).join(', ');
          stockErrors.push(
            `Color "${selectedColor}" not available for ${saree.name}. Available colors: ${availableColors}`
          );
          continue;
        }

        availableStock = variant.stock || 0;
        console.log(`📊 Using color variant "${selectedColor}". Stock: ${availableStock}`);

      } else {
        // No color variants - use main stock
        availableStock = saree.stock || 0;
        console.log(`📊 No color variants. Using main stock: ${availableStock}`);
      }

      // Validate stock quantity
      if (availableStock === 0) {
        stockErrors.push(
          `${saree.name}${selectedColor ? ` (${selectedColor})` : ''} is out of stock`
        );
      } else if (item.quantity > availableStock) {
        stockErrors.push(
          `${saree.name}${selectedColor ? ` (${selectedColor})` : ''}: Only ${availableStock} available, but ${item.quantity} requested`
        );
      }
    }

    // If there are stock errors, return them
    if (stockErrors.length > 0) {
      console.error("❌ Stock validation errors:", stockErrors);
      return res.status(400).json({
        message: 'Stock validation failed',
        errors: stockErrors,
      });
    }

    console.log("✅ Stock validation passed");

    // ✅ Handle address - IMPORTANT: Order model expects 'address' not 'shippingAddress'
    let orderAddress = null;

    if (address) {
      // Address object provided directly
      orderAddress = address;
    } else if (newAddress) {
      // New address provided
      orderAddress = newAddress;
    } else if (addressId) {
      // Address ID provided - fetch full address from database
      console.log(`📍 Fetching address from ID: ${addressId}`);
      const savedAddress = await Address.findOne({
        _id: addressId,
        user: userId
      });

      if (!savedAddress) {
        console.error(`❌ Address not found for ID: ${addressId}`);
        return res.status(404).json({
          success: false,
          message: "Delivery address not found"
        });
      }

      // Convert saved address to order format
      orderAddress = {
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

    // ✅ Validate address for COD
    if (paymentMethod === "COD" && !orderAddress) {
      console.error("❌ Address required for COD payment");
      return res.status(400).json({
        success: false,
        message: "Delivery address is required for COD payment"
      });
    }

    // Create order with proper structure (matching Order model)
    const orderData = {
      user: userId,
      items,
      paymentMethod,
      totalAmount,
      // Note: orderStatus and paymentStatus are set by defaults
    };

    // Add address if available
    if (orderAddress) {
      orderData.address = orderAddress;
    }

    console.log("📦 Creating order with data:", JSON.stringify(orderData, null, 2));
    
    const order = new Order(orderData);
    await order.save();
    console.log("✅ Order created:", order._id);

    // Reduce stock from database
    for (const item of items) {
      const productId = item.product || item.sareeId;
      const saree = await Saree.findById(productId);
      const selectedColor = item.selectedColor || item.color;

      if (saree) {
        let hasColorVariants = saree.colorVariants && saree.colorVariants.length > 0;

        if (hasColorVariants && selectedColor) {
          // Deduct from specific color variant
          const variantIndex = saree.colorVariants.findIndex(v => v.color === selectedColor);
          if (variantIndex !== -1) {
            saree.colorVariants[variantIndex].stock = Math.max(0, (saree.colorVariants[variantIndex].stock || 0) - item.quantity);
            console.log(`✅ Deducted ${item.quantity} from color "${selectedColor}". Remaining: ${saree.colorVariants[variantIndex].stock}`);
          }
        } else {
          // Deduct from main stock
          saree.stock = Math.max(0, (saree.stock || 0) - item.quantity);
          console.log(`✅ Deducted ${item.quantity} from main stock. Remaining: ${saree.stock}`);
        }

        await saree.save();
      }
    }

    console.log("✅ Stock reduced successfully");

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      _id: order._id,
      orderId: order._id,
      id: order._id,
      order,
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.sareeId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate('items.sareeId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Restore stock if cancelled
    if (status === 'cancelled') {
      for (const item of order.items) {
        const saree = await Saree.findById(item.sareeId);

        if (saree) {
          if (item.selectedColor && saree.colorVariants?.length > 0) {
            const variantIndex = saree.colorVariants.findIndex(
              (v) => v.color === item.selectedColor
            );

            if (variantIndex !== -1) {
              saree.colorVariants[variantIndex].stock += item.quantity;
            }
          } else {
            saree.stock += item.quantity;
          }

          await saree.save();
        }
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

export default router;