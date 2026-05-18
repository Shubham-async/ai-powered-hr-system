import Offer from "../models/Offer and Onboarding/Offer.js";
import OnboardingTask from "../models/Offer and Onboarding/OnboardingTask.js";
import Candidate from "../models/candidateModel.js";
import JD from "../models/jdModel.js";
import { sendMail } from "../tools/mailTools.js";

export const createOffer = async (req, res) => {
  try {
    const { candidate_id, job_id, baseSalary, positionTitle, companyName = "Aurion" } = req.body;
    
    const candidate = await Candidate.findById(candidate_id);
    const dateFormatted = new Date().toLocaleDateString();

    const offerLetterText = `
Dear ${candidate?.name || 'Candidate'},

We are thrilled to offer you the position of ${positionTitle} at ${companyName}.
Your starting base salary will be INR ${baseSalary} per annum.

Please respond to this email to accept or decline the offer. 
We look forward to welcoming you to the team.

Sincerely,
HR Department | ${companyName}
Date: ${dateFormatted}
    `.trim();

    const offer = await Offer.create({
      candidate_id,
      job_id,
      salary_offered: { amount: baseSalary, currency: "INR" },
      offer_letter_text: offerLetterText,
      status: "approved",
      sent_at: new Date(),
    });

    if (candidate && candidate.email) {
      await sendMail({
        to: candidate.email,
        subject: `Job Offer: ${positionTitle} at ${companyName}`,
        body: offerLetterText,
        relatedModule: "onboarding",
        refModel: "Candidate",
        refId: candidate._id
      });
      candidate.status = "hired";
      await candidate.save();
    }

    res.status(201).json({ success: true, message: "Offer created and sent", offer });
  } catch (error) {
    console.error("Offer Creation Error:", error);
    res.status(500).json({ success: false, message: "Failed to create offer" });
  }
};

export const rejectCandidate = async (req, res) => {
  try {
    const { candidate_id, job_id } = req.body;
    const candidate = await Candidate.findById(candidate_id);
    const job = await JD.findById(job_id);
    const jobTitle = job?.aiResponse?.jobTitle || "the position";

    if (candidate && candidate.email) {
      await sendMail({
        to: candidate.email,
        subject: `Update regarding your application for ${jobTitle}`,
        body: `Dear ${candidate.name},\n\nThank you for taking the time to interview with us for the ${jobTitle} position. While we were impressed with your background, we have decided to move forward with another candidate whose experience better aligns with our current needs.\n\nWe will keep your resume on file for future opportunities.\n\nBest regards,\nHR Team | Aurion AI`,
        relatedModule: "hiring",
        refModel: "Candidate",
        refId: candidate._id
      });
      candidate.status = "rejected";
      await candidate.save();
    }
    res.status(200).json({ success: true, message: "Candidate rejected and notified." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reject candidate" });
  }
};

export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("candidate_id job_id")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch offers" });
  }
};

export const updateOfferStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
    res.status(200).json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update offer" });
  }
};

export const createOnboardingTask = async (req, res) => {
  try {
    const { candidate_id, offer_id, task_title, task_description, due_date } = req.body;
    const newTask = await OnboardingTask.create({
      candidate_id,
      offer_id,
      task_title,
      task_description,
      due_date,
    });
    res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

export const getOnboardingTasks = async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const tasks = await OnboardingTask.find({ candidate_id }).sort({ due_date: 1 });
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};
