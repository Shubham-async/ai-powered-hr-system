import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  year: { type: Number, required: true },
  casualLeave: { type: Number, default: 0 },
  sickLeave: { type: Number, default: 0 },
  earnedLeave: { type: Number, default: 0 },
  usedCasual: { type: Number, default: 0 },
  usedSick: { type: Number, default: 0 },
  usedEarned: { type: Number, default: 0 }
}, { timestamps: true });

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

export default mongoose.model("LeaveBalance", leaveBalanceSchema);