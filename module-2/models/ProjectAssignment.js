import mongoose from "mongoose";

const projectAssignmentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  roleInProject: String,
  allocationPercentage: { type: Number, min: 0, max: 100, default: 100 }
}, { timestamps: true });

export default mongoose.model("ProjectAssignment", projectAssignmentSchema);