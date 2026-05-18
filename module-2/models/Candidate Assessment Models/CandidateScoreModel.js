import mongoose from "mongoose";

const candidateScoreSchema = new mongoose.Schema(
  {
    candidate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JD",
      required: true,
    },
    test_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateTest",
    },
    section_scores: [
      {
        section_name: { type: String },
        max_marks: { type: Number },
        obtained_marks: { type: Number },
        ai_score_adjustment: { type: Number, default: 0 }, // optional AI-based adjustment
      },
    ],
    passing_score: {
      type: Number,
      default: 80,
      required: true,
    },
    total_score: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    ai_analysis: {
      // From AI service - performance, sentiment, attention
      confidence_score: { type: Number, min: 0, max: 1 },
      communication_score: { type: Number, min: 0, max: 1 },
      coding_efficiency: { type: Number, min: 0, max: 1 },
      final_recommendation: {
        type: String,
        enum: ["strong_yes", "yes", "neutral", "no", "strong_no"],
        default: "neutral",
      },
      remarks: { type: String },
    },
    evaluated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    evaluated_at: Date,
    shortlist_notification_sent: {
      type: Boolean,
      default: false,
    },
    shortlist_notification_sent_at: Date,
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

candidateScoreSchema.index({ candidate_id: 1, job_id: 1 });

const CandidateScore = mongoose.model("CandidateScore", candidateScoreSchema);
export default CandidateScore;
