import { Schema, model, models } from "mongoose";

const issueSchema = new Schema(
  {
    asset: {
      type: Schema.Types.ObjectId,
      ref: "assets",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Issue title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Issue description is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "assigned", "in_progress", "resolved", "closed"],
      default: "open",
    },
    reportedBy: {
      // Can be a user ID or anonymous info
      userId: { type: Schema.Types.ObjectId, ref: "users" },
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    imageUrl: { type: String },
    aiSuggestion: { type: String },
    resolutionNotes: { type: String },
    resolvedAt: { type: Date },
    estimatedCompletionDate: { type: Date },
  },
  { timestamps: true },
);

const Issue = models.issues || model("issues", issueSchema);
export default Issue;
