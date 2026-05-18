import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  headId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
}, { timestamps: true });

export default mongoose.model("Department", departmentSchema);