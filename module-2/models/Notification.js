import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  
  type: {
    type: String,
    enum: [
      "leave_filed",        // Agent filed a leave on behalf of employee
      "leave_approved",     // HR approved the leave
      "leave_rejected",     // HR rejected the leave
      "interview_scheduled",
      "interview_reminder",
      "project_assigned",
      "milestone_due",
      "milestone_completed",
      "onboarding_task",
      "offer_sent",
      "mail_sent",
      "general"
    ],
    required: true
  },

  title: { type: String },
  message: { type: String, required: true },
  
  // Optional reference to the related record
  refModel: { type: String }, // "LeaveRequest", "Project", "Interview", etc.
  refId: { type: mongoose.Schema.Types.ObjectId },

  // Delivery
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  deliveredVia: { type: String, enum: ["socket", "email", "sms"], default: "socket" },

  // Priority
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" }

}, { timestamps: true });

// Index for fast unread query
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
