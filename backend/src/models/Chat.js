import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    // Conversation participants
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Messages in this conversation
    messages: [
      {
        sender: {
          type: String,
          enum: ["customer", "admin"],
          required: true
        },
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        text: {
          type: String,
          required: true
        },
        sentAt: {
          type: Date,
          default: Date.now
        },
        isRead: {
          type: Boolean,
          default: false
        }
      }
    ],

    // Conversation status
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active"
    },

    // Last message info (for quick lookups)
    lastMessage: {
      type: String,
      default: ""
    },

    lastMessageAt: {
      type: Date,
      default: Date.now
    },

    lastMessageSender: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer"
    }
  },
  { timestamps: true }
);

// Indexes for efficient querying
chatSchema.index({ customer: 1, status: 1 });
chatSchema.index({ lastMessageAt: -1 });

export default mongoose.model("Chat", chatSchema);