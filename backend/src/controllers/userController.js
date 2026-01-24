import User from "../models/User.js";

// 👥 Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔄 Update user role (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!["admin", "customer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'customer'" });
    }

    // Prevent self-demotion (optional but recommended)
    if (req.params.id === req.user.id && role === "customer") {
      return res.status(400).json({ message: "You cannot demote yourself" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: `User role updated to ${role}`,
      user
    });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    // Prevent self-deletion (optional but recommended)
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      message: "User deleted successfully",
      deletedUser: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 👤 Get user by ID (Admin only)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(400).json({ message: "Invalid user ID" });
  }
};

// 📊 Get user statistics (Admin only)
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const customerCount = await User.countDocuments({ role: "customer" });

    res.json({
      totalUsers,
      admins: adminCount,
      customers: customerCount
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: error.message });
  }
};