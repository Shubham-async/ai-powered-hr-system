import mongoose from "mongoose";

const candidateTestSchema = new mongoose.Schema(
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
    test_type: {
      type: String,
      enum: ["MCQ", "Coding", "Aptitude", "Communication", "Custom"],
      required: true,
    },
    questions: [
      {
        question_id: { type: String },
        question_text: { type: String },
        options: [{ type: String }],
        correct_answer: { type: String },
        selected_answer: { type: String },
        is_correct: { type: Boolean, default: false },
        marks: { type: Number, default: 1 },
      },
    ],
    total_marks: {
      type: Number,
      default: 0,
    },
    test_status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "evaluated"],
      default: "pending",
    },
    started_at: Date,
    completed_at: Date,
    duration_minutes: Number,
    proctoring_data: {
      // For AI proctoring or webcam validation
      face_detections: { type: Number, default: 0 },
      anomalies_detected: { type: Number, default: 0 },
      suspicion_level: { type: Number, min: 0, max: 1 },
      summary: { type: String },
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

candidateTestSchema.index({ candidate_id: 1, job_id: 1 });

const CandidateTest = mongoose.model("CandidateTest", candidateTestSchema);
export default CandidateTest;
