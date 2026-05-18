import mongoose from "mongoose";

const schema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JD",
    required: true,
  },
  shortlistedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["shortlisted", "rejected", "under_review"],
    default: "under_review",
  },
  aiEvaluation: {
    score: {
      type: Number, // 0–100 match score
      min: 0,
      max: 100,
    },
    confidence: {
      type: Number, // AI confidence level
      min: 0,
      max: 1,
    },
    reasoning: {
      type: String, // explanation from AI why candidate was selected/rejected
    },
    recommendation: {
      type: String, // e.g. "Strong fit", "Average fit", "Not suitable"
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  loginId: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
});
export default mongoose.models.shortlistedcandidate || mongoose.model('shortlistedcandidate', schema);