import mongoose from  'mongoose';

const Schema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        resume: { type: String }, // Storing URL of the resume
        skills: { type: [String] },
        summary: { type: String },
        experience: [
            {
                company: { type: String },
                role: { type: String },
                duration: { type: String },
                description: { type: String },
            },
        ],
            education: [
            {
                institution: { type: String },
                degree: { type: String },
                fieldOfStudy: { type: String },
                startDate: { type: Date },
                endDate: { type: Date },
            },
        ],
        projects: [
            {
                name: { type: String },
                description: { type: String },
                technologies: { type: [String] },
                link: { type: String },
            },
        ],
        interests: { type: [String] },
        job_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JD', // Reference to Job Description model
            required: true,
        },
        status: {
            type: String,
            enum: ["new", "screening", "shortlisted", "assessment", "interview", "offer", "rejected", "hired"],
            default: "new",
        },
        candidate_applied_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CandidateApplied',
        },
    },
    { timestamps: true }
);

// Allow a candidate to apply to multiple different jobs, 
// but prevent duplicate applications for the exact same job profile.
Schema.index({ email: 1, job_id: 1 }, { unique: true });

export default mongoose.model("Candidate",Schema);