import mongoose from 'mongoose';

const Schema = new mongoose.Schema(
  {
    resume: { type: String }, // Storing URL of the resume
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JD', // Reference to Job Description model
        required: true,
    },
  },
  { timestamps: true }
);

const CandidateApplied = mongoose.models.CandidateApplied || mongoose.model('CandidateApplied', Schema);
export default CandidateApplied;
