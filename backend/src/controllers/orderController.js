import Order from "../models/Order.js";
import Product from "../models/Product.js";

// 🛒 Place Order
export const placeOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product?.name}`
        });
      }

      product.stock -= item.quantity;
      await product.save();

      totalAmount += product.price * item.quantity;
      item.price = product.price;
    }

    const order = await Order.create({
      user: req.user.id,
      items,
      totalAmount
    });

    res.status(201).json(order);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👤 User Orders
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .populate("items.product", "name price");

  res.json(orders);
};

// 🛠 Admin Orders
export const getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate("user", "email")
    .populate("items.product", "name");

  res.json(orders);
};
