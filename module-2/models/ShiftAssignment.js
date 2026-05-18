import mongoose from "mongoose";

const shiftAssignmentSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift", required: true },
  effectiveFrom: Date,
  effectiveTo: Date
}, { timestamps: true });

export default mongoose.model("ShiftAssignment", shiftAssignmentSchema);