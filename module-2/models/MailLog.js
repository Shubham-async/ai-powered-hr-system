import mongoose from "mongoose";

const mailLogSchema = new mongoose.Schema({
  // Addressing
  to: { type: String, required: true },          // Email address or employee name
  toEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  from: { type: String, default: "aurion@hr-system.ai" },
  cc: [String],

  // Content
  subject: { type: String, required: true },
  body: { type: String, required: true },         // Plain text or HTML
  isHtml: { type: Boolean, default: false },

  // Metadata
  status: {
    type: String,
    enum: ["sent", "simulated", "failed", "draft"],
    default: "simulated"
  },
  triggeredBy: {
    type: String,
    enum: ["agent", "manual", "system"],
    default: "agent"
  },
  triggeredByEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  
  // Context
  relatedModule: {
    type: String,
    enum: ["hiring", "leave", "project", "onboarding", "general"],
    default: "general"
  },
  refModel: { type: String },
  refId: { type: mongoose.Schema.Types.ObjectId },

  // Preview tracking
  previewedInUI: { type: Boolean, default: false },
  sentAt: { type: Date }

}, { timestamps: true });

mailLogSchema.index({ toEmployeeId: 1, createdAt: -1 });
mailLogSchema.index({ relatedModule: 1, status: 1 });

export default mongoose.model("MailLog", mailLogSchema);
