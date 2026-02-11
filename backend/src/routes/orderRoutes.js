import express from 'express';
import Order from '../models/Order.js';
import Saree from '../models/Saree.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create new order with stock validation
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
    const userId = req.user.id;

    const stockErrors = [];

    for (const item of items) {
      const saree = await Saree.findById(item.sareeId);

      if (!saree) {
        stockErrors.push(`Saree ${item.name} not found`);
        continue;
      }

      let availableStock = saree.stock;

      if (item.selectedColor && saree.colorVariants?.length > 0) {
        const variant = saree.colorVariants.find(
          (v) => v.color === item.selectedColor
        );

        if (variant) {
          availableStock = variant.stock;
        } else {
          stockErrors.push(
            `Color variant ${item.selectedColor} not found for ${saree.name}`
          );
          continue;
        }
      }

      if (availableStock === 0) {
        stockErrors.push(
          `${saree.name}${item.selectedColor ? ` (${item.selectedColor})` : ''} is out of stock`
        );
      } else if (item.quantity > availableStock) {
        stockErrors.push(
          `${saree.name}${item.selectedColor ? ` (${item.selectedColor})` : ''}: Only ${availableStock} available, but ${item.quantity} requested`
        );
      }
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        message: 'Stock validation failed',
        errors: stockErrors,
      });
    }

    const order = new Order({
      userId,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      status: 'pending',
    });

    await order.save();

    // Reduce stock
    for (const item of items) {
      const saree = await Saree.findById(item.sareeId);

      if (saree) {
        if (item.selectedColor && saree.colorVariants?.length > 0) {
          const variantIndex = saree.colorVariants.findIndex(
            (v) => v.color === item.selectedColor
          );

          if (variantIndex !== -1) {
            saree.colorVariants[variantIndex].stock -= item.quantity;
          }
        } else {
          saree.stock -= item.quantity;
        }

        await saree.save();
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
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