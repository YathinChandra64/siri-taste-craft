import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// 💬 Start or get existing conversation
export const getOrCreateConversation = async (req, res) => {
  try {
    const customerId = req.user.role === "admin" ? req.query.customerId : req.user.id;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    let conversation = await Chat.findOne({ customer: customerId })
      .populate("customer", "name email");

    if (!conversation) {
      conversation = await Chat.create({
        customer: customerId
      });
      await conversation.populate("customer", "name email");
    }

    res.json(conversation);
  } catch (error) {
    console.error("Get/Create conversation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 💬 Send message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const conversation = await Chat.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Verify permissions: only the customer or admin can message
    if (userRole === "customer" && conversation.customer.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to message in this conversation" });
    }

    // Add message
    const message = {
      sender: userRole,
      senderId: userId,
      text: text.trim(),
      sentAt: new Date(),
      isRead: false
    };

    conversation.messages.push(message);
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    conversation.lastMessageSender = userRole;

    await conversation.save();

    // 📧 Create notification for the OTHER party
    const notificationType = userRole === "customer" ? "customer_message" : "admin_reply";
    const targetUser = userRole === "customer" ? null : conversation.customer;

    await Notification.create({
      type: "message_reply",
      targetUser: targetUser,
      title: userRole === "customer" ? "New customer message" : "Admin replied",
      message: `New message from ${userRole === "customer" ? "customer" : "admin"}`,
      relatedUserId: userRole === "customer" ? userId : conversation.customer,
      conversationId: conversationId
    });

    res.status(201).json({
      message: "Message sent",
      conversation
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📖 Get all conversations (admin view)
export const getAllConversations = async (req, res) => {
  try {
    // Only admin can view all conversations
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const conversations = await Chat.find()
      .populate("customer", "name email phone")
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error("Get all conversations error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📖 Get user's conversation (customer view)
export const getUserConversation = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversation = await Chat.findOne({ customer: userId })
      .populate("customer", "name email");

    if (!conversation) {
      return res.json(null);
    }

    res.json(conversation);
  } catch (error) {
    console.error("Get user conversation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Chat.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Mark all unread messages as read
    conversation.messages.forEach((msg) => {
      msg.isRead = true;
    });

    await conversation.save();

    res.json({ message: "Marked as read", conversation });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🚪 Close conversation
export const closeConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Only admin can close
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const conversation = await Chat.findByIdAndUpdate(
      conversationId,
      { status: "closed" },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json({ message: "Conversation closed", conversation });
  } catch (error) {
    console.error("Close conversation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔄 Reopen conversation (when customer messages again)
export const reopenConversation = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;

    const conversation = await Chat.findByIdAndUpdate(
      conversationId,
      { status: "active" },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json({ message: "Conversation reopened", conversation });
  } catch (error) {
    console.error("Reopen conversation error:", error);
    res.status(500).json({ message: error.message });
  }
};