import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  employmentType: {
    type: String,
    enum: ["Full-time", "Contract", "Intern"],
    default: "Full-time"
  },
  joiningDate: Date,
  status: {
    type: String,
    enum: ["Active", "On Leave", "Resigned"],
    default: "Active"
  },
  salary: Number
}, { timestamps: true });

export default mongoose.model("Employee", employeeSchema);