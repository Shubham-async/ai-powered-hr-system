import InterviewSchedule from '../models/Interview Scheduling Models/InterviewSchedulingModels.js';
import Candidate from '../models/candidateModel.js';
import User from '../models/User.js';
import JD from '../models/jdModel.js';
import { sendMail } from '../tools/mailTools.js';

export const scheduleInterview = async (req, res) => {
  try {
    const { candidate_id, job_id, scheduled_time, round, mode, interviewer_ids, meeting_link } = req.body;
    
    // Auto-generate meeting link if none exists
    const finalMeetingLink = meeting_link || "https://meet.google.com/aurion-hr-interview";

    const newSchedule = new InterviewSchedule({
      candidate_id,
      job_id,
      scheduled_time,
      round: round || "technical",
      mode: mode || "online",
      interviewer_ids: interviewer_ids || [],
      meeting_link: finalMeetingLink
    });

    await newSchedule.save();
    
    // Fetch details for email
    const candidate = await Candidate.findById(candidate_id);
    const job = await JD.findById(job_id);
    const jobTitle = job?.aiResponse?.jobTitle || "the position";
    const dateFormatted = new Date(scheduled_time).toLocaleString();

    // 1. Send Email to Candidate
    if (candidate && candidate.email) {
      await sendMail({
        to: candidate.email,
        subject: `Interview Scheduled for ${jobTitle}`,
        body: `Hello ${candidate.name},\n\nWe are pleased to inform you that your ${round || 'technical'} interview for ${jobTitle} has been scheduled.\n\nTime: ${dateFormatted}\nMode: ${mode || 'online'}\nLink/Location: ${finalMeetingLink}\n\nBest of luck!\n\nHR Team | Aurion AI`,
        relatedModule: "hiring",
        refModel: "Candidate",
        refId: candidate._id
      });
    }

    // 2. Send Emails to Interviewers
    if (interviewer_ids && interviewer_ids.length > 0) {
      const interviewers = await User.find({ _id: { $in: interviewer_ids } });
      for (const interviewer of interviewers) {
        if (interviewer.email) {
          await sendMail({
            to: interviewer.email,
            subject: `Action Required: You are an interviewer for ${jobTitle}`,
            body: `Hello ${interviewer.name},\n\nYou have been firmly scheduled to conduct an interview for the ${jobTitle} position.\n\nCandidate: ${candidate?.name || 'Candidate'}\nTime: ${dateFormatted}\nRound: ${round || 'technical'}\nLocation/Link: ${finalMeetingLink}\n\nPlease be prepared 5 minutes before the start time.\n\nThank you,\nHR Pipeline | Aurion AI`,
            relatedModule: "hiring",
            refModel: "User",
            refId: interviewer._id
          });
        }
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: "Interview scheduled successfully and emails sent!",
      data: newSchedule 
    });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getInterviews = async (req, res) => {
  try {
    const { jobId } = req.params;
    let interviews;
    if (!jobId || jobId === 'all') {
      interviews = await InterviewSchedule.find().populate('candidate_id job_id');
    } else {
      interviews = await InterviewSchedule.find({ job_id: jobId }).populate('candidate_id job_id');
    }
    res.status(200).json({ success: true, data: interviews });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const interview = await InterviewSchedule.findByIdAndUpdate(id, { status }, { new: true }).populate('candidate_id job_id');
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found" });
    res.status(200).json({ success: true, message: "Status updated", data: interview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitInterviewFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, score } = req.body;
    const interview = await InterviewSchedule.findByIdAndUpdate(id, { feedback, score, status: "completed" }, { new: true }).populate('candidate_id job_id');
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found" });
    res.status(200).json({ success: true, message: "Feedback recorded", data: interview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
