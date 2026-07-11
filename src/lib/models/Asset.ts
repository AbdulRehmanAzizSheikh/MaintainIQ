import { Schema, model, models } from "mongoose";

const assetSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
    },
    assetTag: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "HVAC",
        "Electrical",
        "Plumbing",
        "Fire Safety",
        "IT Equipment",
        "Furniture",
        "Vehicle",
        "Medical Equipment",
        "Kitchen Equipment",
        "Other",
      ],
      default: "Other",
    },
    location: {
      building: { type: String, trim: true },
      floor: { type: String, trim: true },
      room: { type: String, trim: true },
    },
    description: {
      type: String,
      trim: true,
    },
    manufacturer: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    status: {
      type: String,
      enum: ["operational", "under_maintenance", "decommissioned", "faulty"],
      default: "operational",
    },
    imageUrl: { type: String },
    qrCodeUrl: { type: String },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    organization: {
      type: String,
      trim: true,
    },
    nextServiceDate: { type: Date },
    lastServiceDate: { type: Date },
  },
  { timestamps: true },
);

const Asset = models.assets || model("assets", assetSchema);
export default Asset;
