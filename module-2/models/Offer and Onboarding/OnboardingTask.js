import mongoose from "mongoose";

const onboardingTaskSchema = new mongoose.Schema(
    {
        candidate_id: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
        offer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Offer" },
        task_title: String,
        task_description: String,
        status: { type: String, enum: ["pending", "completed"], default: "pending" },
        due_date: Date,
    },
    { timestamps: true }
);

const OnboardingTask = mongoose.model("OnboardingTask", onboardingTaskSchema);
export default OnboardingTask;
