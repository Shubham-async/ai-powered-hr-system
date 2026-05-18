import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
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
        offer_letter_text: {
            type: String,
        },
        salary_offered: {
            amount: { type: Number, required: true },
            currency: { type: String, default: "INR" },
            benchmark_position: { type: Number }, // percentile position in market
        },
        status: {
            type: String,
            enum: ["draft", "pending_approval", "approved", "sent", "accepted", "rejected"],
            default: "draft",
        },
        approval_chain: [
            {
                approver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                level: Number,
                status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
                acted_at: Date,
            },
        ],
        signature_link: { type: String },
        sent_at: Date,
        accepted_at: Date,
        rejected_at: Date,
    },
    { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
