import mongoose from "mongoose";

const jdSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // optional
    },
    prompt: {
      type: String,
      required: true,
    },
    aiResponse: {
      type: mongoose.Schema.Types.Mixed, // <-- stores any JSON structure
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "posted"],
      default: "queued",
    },
    postedPlatforms: [String],
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    platformPosts: [
      {
        platform: String,
        success: Boolean,
        message: String,
        status: { type: String, enum: ["success", "failed"] },
        postedAt: { type: Date, default: Date.now },
      },
    ],

  },
  { timestamps: true }
);

const JD = mongoose.models.JD || mongoose.model("JD", jdSchema);
export default JD;
