import Contact from "../models/Contact.js";

// 📨 Submit contact form (Public - No auth needed)
export const submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: "Name, email, and message are required" 
      });
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Invalid email format" 
      });
    }

    // Message length validation
    if (message.trim().length < 5) {
      return res.status(400).json({ 
        message: "Message must be at least 5 characters long" 
      });
    }

    // Create contact message
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      status: "new"
    });

    res.status(201).json({
      message: "Your message has been sent successfully!",
      contact
    });

  } catch (error) {
    console.error("Contact submission error:", error);
    res.status(500).json({ message: "Failed to submit contact form" });
  }
};

// ✅ NEW: Get notifications for logged-in customer (their own messages with replies)
export const getCustomerNotifications = async (req, res) => {
  try {
    const userEmail = req.user.email; // From auth middleware

    if (!userEmail) {
      return res.status(400).json({ message: "User email not found" });
    }

    // Find all messages from this customer that have replies
    const notifications = await Contact.find({
      email: userEmail,
      reply: { $ne: null } // Only messages with replies
    }).sort({ repliedAt: -1 });

    res.json(notifications);

  } catch (error) {
    console.error("Get customer notifications error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 👥 Get all contacts (Admin only)
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.error("Get contacts error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📖 Get contact by ID (Admin only)
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Mark as read
    contact.status = "read";
    await contact.save();

    res.json(contact);
  } catch (error) {
    console.error("Get contact error:", error);
    res.status(400).json({ message: "Invalid contact ID" });
  }
};

// 💬 Reply to contact (Admin only)
export const replyToContact = async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        reply,
        status: "replied",
        repliedAt: new Date()
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({
      message: "Reply sent successfully",
      contact
    });
  } catch (error) {
    console.error("Reply error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete contact (Admin only)
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({ 
      message: "Contact deleted successfully",
      deletedContact: {
        id: contact._id,
        name: contact.name,
        email: contact.email
      }
    });
  } catch (error) {
    console.error("Delete contact error:", error);
    res.status(500).json({ message: error.message });
  }
};