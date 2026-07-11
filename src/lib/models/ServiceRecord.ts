import { Schema, model, models } from "mongoose";

const serviceRecordSchema = new Schema(
  {
    asset: {
      type: Schema.Types.ObjectId,
      ref: "assets",
      required: true,
    },
    issue: {
      type: Schema.Types.ObjectId,
      ref: "issues",
    },
    serviceType: {
      type: String,
      enum: ["repair", "preventive", "inspection", "replacement", "upgrade"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    cost: {
      type: Number,
      default: 0,
    },
    partsReplaced: [{ type: String }],
    beforeImageUrl: { type: String },
    afterImageUrl: { type: String },
    nextServiceDate: { type: Date },
    duration: {
      // in minutes
      type: Number,
    },
    status: {
      type: String,
      enum: ["completed", "partial", "pending"],
      default: "completed",
    },
  },
  { timestamps: true },
);

const ServiceRecord =
  models.servicerecords || model("servicerecords", serviceRecordSchema);
export default ServiceRecord;
