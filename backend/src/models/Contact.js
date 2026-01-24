import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    message: {
      type: String,
      required: true,
      minlength: 5
    },
    status: {
      type: String,
      enum: ["new", "read", "replied"],
      default: "new"
    },
    reply: {
      type: String,
      default: null
    },
    repliedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);