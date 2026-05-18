// models/hrModel.js
import { Schema, model } from "mongoose";

const hrSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: String, required: true },
    position: { type: String, required: true },
    experienceYears: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default model("HR", hrSchema);
