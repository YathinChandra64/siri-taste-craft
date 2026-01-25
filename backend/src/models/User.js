import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
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
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer"
    },

    // ADD to userSchema:

phone: {
  type: String,
  default: ""
},
address: {
  type: String,
  default: ""
},
city: {
  type: String,
  default: ""
},
state: {
  type: String,
  default: ""
},
zipCode: {
  type: String,
  default: ""
},
profileImage: {
  type: String,
  default: null
}
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
