import UPIConfig from "../models/UpiConfig.js";

// 🔧 Get UPI configuration (for customers at checkout)
export const getUPIConfig = async (req, res) => {
  try {
    let config = await UPIConfig.findOne({ isActive: true });

    // If no config exists, create a default one
    if (!config) {
      config = await UPIConfig.create({
        upiId: "siri@upi",
        merchantName: "Siri Taste Craft",
        instructions: "Please scan the QR code or use the UPI ID to make payment"
      });
    }

    res.json(config);
  } catch (error) {
    console.error("Get UPI config error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔧 Update UPI configuration (admin only)
export const updateUPIConfig = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { upiId, merchantName, instructions, qrCodeImage } = req.body;

    if (!upiId || upiId.trim() === "") {
      return res.status(400).json({ message: "UPI ID is required" });
    }

    let config = await UPIConfig.findOne();

    if (!config) {
      config = await UPIConfig.create({
        upiId,
        merchantName: merchantName || "Siri Taste Craft",
        instructions: instructions || "",
        qrCodeImage: qrCodeImage || null,
        updatedBy: req.user.id
      });
    } else {
      config.upiId = upiId;
      if (merchantName) config.merchantName = merchantName;
      if (instructions) config.instructions = instructions;
      if (qrCodeImage) config.qrCodeImage = qrCodeImage;
      config.updatedBy = req.user.id;
      await config.save();
    }

    res.json({
      message: "UPI configuration updated",
      config
    });
  } catch (error) {
    console.error("Update UPI config error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📊 Get UPI config (admin dashboard)
export const getUPIConfigAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    let config = await UPIConfig.findOne()
      .populate("updatedBy", "name email");

    if (!config) {
      config = await UPIConfig.create({
        upiId: "siri@upi",
        merchantName: "Siri Taste Craft"
      });
    }

    res.json(config);
  } catch (error) {
    console.error("Get UPI config admin error:", error);
    res.status(500).json({ message: error.message });
  }
};