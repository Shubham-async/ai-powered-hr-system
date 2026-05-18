// models/userModel.js
import { Schema, model } from "mongoose";
import { genSalt, hash, compare } from "bcryptjs";

// Base user schema for authentication
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "hr", "employee"], default: "user" }
  },
  { timestamps: true }
);

// Password hashing before saving user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await genSalt(10);
  this.password = await hash(this.password, salt);
  next();
});

// Compare entered password with stored hash
userSchema.methods.matchPassword = function (enteredPassword) {
  return compare(enteredPassword, this.password);
};

export default model("User", userSchema);
