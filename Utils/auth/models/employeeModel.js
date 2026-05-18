// models/employeeModel.js
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    salary: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
