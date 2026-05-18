import mongoose from "mongoose";

const interviewScheduleSchema = new mongoose.Schema(
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
        interviewer_ids: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User", // Interviewer user
            },
        ],
        round: {
            type: String,
            enum: ["technical", "hr", "managerial", "final"],
            default: "technical",
        },
        scheduled_time: {
            type: Date,
            required: false,
        },
        duration_minutes: {
            type: Number,
            default: 45,
        },
        mode: {
            type: String,
            enum: ["online", "onsite"],
            default: "online",
        },
        meeting_link: {
            type: String,
        },
        status: {
            type: String,
            enum: ["scheduled", "completed", "cancelled", "rescheduled", "no_show"],
            default: "scheduled",
        },
        feedback: {
            interviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            comments: String,
            rating: { type: Number, min: 1, max: 5 },
            recommendation: {
                type: String,
                enum: ["strong_yes", "yes", "neutral", "no", "strong_no"],
            },
        },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const InterviewSchedule = mongoose.model(
    "InterviewSchedule",
    interviewScheduleSchema
);
export default InterviewSchedule;
