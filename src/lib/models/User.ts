import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide your username"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide your password"],
      trim: true,
      min: 8,
    },
    role: {
      type: String,
      enum: ["Administrator", "Technician", "Reporter", "Supervisor"],
      default: "Reporter",
    },
    avatarUrl: {
      type: String,
    },
    verify: {
      status: {
        type: Boolean,
        default: false,
      },
      otp: {
        code: {
          type: String,
        },
        expireAt: {
          type: Date,
        },
      },
    },
    passwordReset: {
      otp: {
        code: { type: String },
      },
      expireAt: { type: Date },
    },
  },
  { timestamps: true },
);

const User = models.users || model("users", userSchema);

export default User;
