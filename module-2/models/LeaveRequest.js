import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  leaveType: {
    type: String,
    enum: ["Casual", "Sick", "Earned", "Unpaid", "Paternity", "Maternity"],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number },

  // --- Employee Input ---
  reason: { type: String },
  employeeNote: { type: String },   // raw note from employee to agent

  // --- Agent Mediation ---
  agentNote: { type: String },      // AI-written professional summary sent to HR
  mediatedBy: { type: String, enum: ["agent", "manual"], default: "manual" },

  // --- HR Response ---
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Under Review"],
    default: "Pending"
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  hrComment: { type: String },      // HR's response note

  // --- Notification Tracking ---
  notificationSent: { type: Boolean, default: false },
  notifiedAt: { type: Date },

  // --- Audit ---
  filedVia: { type: String, enum: ["voice", "chat", "manual_form"], default: "manual_form" }
}, { timestamps: true });

// Auto-calculate total days before save
leaveRequestSchema.pre("save", function (next) {
  if (this.startDate && this.endDate) {
    const diff = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;
    this.totalDays = diff > 0 ? diff : 1;
  }
  next();
});

export default mongoose.model("LeaveRequest", leaveRequestSchema);