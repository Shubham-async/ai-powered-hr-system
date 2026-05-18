import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  level: String,
  permissions: [String]
}, { timestamps: true });

export default mongoose.model("Role", roleSchema);