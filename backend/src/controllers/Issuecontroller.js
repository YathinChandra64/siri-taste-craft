import IssueReport from "../models/IssueReport.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// 📝 Report an issue
export const reportIssue = async (req, res) => {
  try {
    const { issueType, description, orderRelated } = req.body;
    const userId = req.user.id;

    if (!issueType || !description) {
      return res.status(400).json({ message: "Issue type and description are required" });
    }

    // Get customer details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const issueReport = await IssueReport.create({
      customer: userId,
      customerName: user.name,
      customerEmail: user.email,
      issueType,
      description,
      orderRelated: orderRelated || null
    });

    // 📢 Notify admin
    await Notification.create({
      type: "general",
      targetUser: null, // Admin notification
      title: "New issue reported",
      message: `${user.name} reported a ${issueType} issue`,
      relatedUserId: userId
    });

    res.status(201).json({
      message: "Issue reported successfully",
      issueReport
    });
  } catch (error) {
    console.error("Report issue error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📋 Get all issues (admin)
export const getAllIssues = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { status, issueType } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (issueType) filter.issueType = issueType;

    const issues = await IssueReport.find(filter)
      .populate("customer", "name email phone")
      .populate("orderRelated")
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error("Get all issues error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📖 Get user's issues
export const getUserIssues = async (req, res) => {
  try {
    const userId = req.user.id;

    const issues = await IssueReport.find({ customer: userId })
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error("Get user issues error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔄 Update issue status (admin)
export const updateIssueStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { issueId } = req.params;
    const { status, adminNotes } = req.body;

    const issue = await IssueReport.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    issue.status = status;
    if (adminNotes) issue.adminNotes = adminNotes;

    if (status === "resolved") {
      issue.resolvedAt = new Date();
    }

    await issue.save();

    // Notify customer if issue is resolved
    if (status === "resolved") {
      await Notification.create({
        type: "general",
        targetUser: issue.customer,
        title: "Issue resolved",
        message: "Your reported issue has been resolved",
        relatedUserId: req.user.id
      });
    }

    res.json({
      message: "Issue updated",
      issue
    });
  } catch (error) {
    console.error("Update issue error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📊 Get issue statistics (admin)
export const getIssueStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const total = await IssueReport.countDocuments();
    const reported = await IssueReport.countDocuments({ status: "reported" });
    const inProgress = await IssueReport.countDocuments({ status: "in_progress" });
    const resolved = await IssueReport.countDocuments({ status: "resolved" });

    const byType = await IssueReport.aggregate([
      {
        $group: {
          _id: "$issueType",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      total,
      reported,
      inProgress,
      resolved,
      byType
    });
  } catch (error) {
    console.error("Get issue stats error:", error);
    res.status(500).json({ message: error.message });
  }
};