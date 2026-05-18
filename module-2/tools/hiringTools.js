import JD from "../models/jdModel.js";
import Candidate from "../models/candidateModel.js";
import ShortlistedCandidatesModel from "../models/Resume Screening Models/ShortlistedCandidatesModel.js";
import { generateAIJD } from "../services/aiService.js";
import resumeQueue from "../queues/resumeShortListQueue.js";
import mongoose from 'mongoose';

export const generateJobDescription = async (role, requirements, experienceLevel) => {
  try {
    const fullPrompt = `Create a job description for a ${role} with the following requirements: ${requirements}. Experience level: ${experienceLevel}.`;
    
    const aiJd = await generateAIJD(fullPrompt);
    
    const newJd = new JD({
      prompt: fullPrompt,
      aiResponse: aiJd,
      status: "completed",
      approvalStatus: "pending"
    });

    await newJd.save();
    return { success: true, message: "Job Description generated successfully!", data: newJd };
  } catch (error) {
    console.error("Error in generateJobDescription tool:", error.message);
    return { success: false, message: error.message };
  }
};

export const shortlistCandidates = async (jobId, topN = 5) => {
  try {
    if (!jobId) throw new Error("jobId is required");
    
    // Add to queue for background processing
    await resumeQueue.add('resumeShortlistQueue', { jdId: jobId });
    
    return { success: true, message: "Resume shortlisting initiated in background." };
  } catch (error) {
    console.error("Error in shortlistCandidates tool:", error.message);
    return { success: false, message: error.message };
  }
};

import InterviewSchedule from "../models/Interview Scheduling Models/InterviewSchedulingModels.js";
import User from "../models/User.js";
import { sendMail } from "../tools/mailTools.js";

export const scheduleInterviews = async (candidateId, jobId, dateStr, round = "technical", mode = "online", interviewerIds = []) => {
  try {
    const finalMeetingLink = "https://meet.google.com/aurion-hr-interview";

    const newSchedule = new InterviewSchedule({
      candidate_id: candidateId,
      job_id: jobId,
      scheduled_time: dateStr,
      round: round,
      mode: mode,
      interviewer_ids: interviewerIds,
      meeting_link: finalMeetingLink
    });

    await newSchedule.save();

    const candidate = await Candidate.findById(candidateId);
    const job = await JD.findById(jobId);
    const jobTitle = job?.aiResponse?.jobTitle || "the position";
    const dateFormatted = new Date(dateStr).toLocaleString();

    if (candidate && candidate.email) {
      await sendMail({
        to: candidate.email,
        subject: `Interview Scheduled for ${jobTitle}`,
        body: `Hello ${candidate.name},\n\nWe are pleased to inform you that your ${round} interview for ${jobTitle} has been scheduled.\n\nTime: ${dateFormatted}\nMode: ${mode}\nLink: ${finalMeetingLink}\n\nBest of luck!\n\nHR Team | Aurion AI`,
        relatedModule: "hiring",
        refModel: "Candidate",
        refId: candidate._id
      });
    }

    if (interviewerIds && interviewerIds.length > 0) {
      const interviewers = await User.find({ _id: { $in: interviewerIds } });
      for (const interviewer of interviewers) {
        if (interviewer.email) {
          await sendMail({
            to: interviewer.email,
            subject: `Action Required: Interviewer assigned for ${jobTitle}`,
            body: `Hello ${interviewer.name},\n\nYou have been assigned to conduct an interview.\n\nCandidate: ${candidate?.name || 'Candidate'}\nTime: ${dateFormatted}\nRound: ${round}\nLink: ${finalMeetingLink}`,
            relatedModule: "hiring",
            refModel: "User",
            refId: interviewer._id
          });
        }
      }
    }

    return { status: "success", message: `Scheduled interview for candidate ${candidate?.name || candidateId} on ${dateFormatted} for ${round} round.` };
  } catch (error) {
    console.error("Error in scheduleInterviews tool:", error.message);
    return { status: "failed", message: error.message };
  }
};

export const postToPlatform = async (platformName, jobData) => {
  try {
    const PlatformKey = mongoose.model("PlatformKey");
    if (!PlatformKey) return { status: "failed", message: "PlatformKey schema missing." };
    
    const keyRecord = await PlatformKey.findOne({ platformName });
    if (!keyRecord) return { status: "failed", message: `Key not found for platform: ${platformName}` };
    
    // This is truly an external call, so axios is correct here
    // const response = await axios.post(keyRecord.apiUrl, jobData, ...);
    return { status: "success", message: `Posted ${jobData.role} to ${platformName} (Simulated).` };
  } catch (error) {
    console.error(`Error posting to ${platformName}:`, error.message);
    return { status: "failed", message: error.message };
  }
};

export const getCandidates = async (jobId) => {
  try {
    const filter = (jobId && jobId !== 'all') ? { job_id: jobId } : {};
    const candidates = await Candidate.find(filter);
    return { success: true, data: candidates };
  } catch (error) {
    console.error("Error in getCandidates tool:", error.message);
    return { success: false, message: error.message };
  }
};

export const getShortlistedCandidates = async (jobId) => {
  try {
    const filter = (jobId && jobId !== 'all') ? { jobId: jobId } : {};
    const candidates = await ShortlistedCandidatesModel.find(filter).populate("candidateId");
    return { success: true, data: candidates };
  } catch (error) {
    console.error("Error in getShortlistedCandidates tool:", error.message);
    return { success: false, message: error.message };
  }
};

export const finalizeCandidateDecision = async (candidateId, jobId, decision, baseSalary, positionTitle) => {
  try {
    if (decision === "hire") {
      // Simulate REST call to createOffer wrapper or implement directly
      const candidate = await Candidate.findById(candidateId);
      const offerLetterText = `Dear ${candidate?.name || 'Candidate'},\n\nWe are thrilled to offer you the position of ${positionTitle}.\nYour starting base salary will be INR ${baseSalary} per annum.\n\nPlease respond to this email to accept or decline the offer.\n\nSincerely,\nHR Department | Aurion`;
      
      if (candidate && candidate.email) {
        await sendMail({
          to: candidate.email,
          subject: `Job Offer: ${positionTitle} at Aurion`,
          body: offerLetterText,
          relatedModule: "onboarding",
          refModel: "Candidate",
          refId: candidate._id
        });
        candidate.status = "hired";
        await candidate.save();
      }
      return { success: true, message: `Offer letter finalized and sent to candidate for ${positionTitle} with salary ${baseSalary}.` };
      
    } else if (decision === "reject") {
      const candidate = await Candidate.findById(candidateId);
      const job = await JD.findById(jobId);
      const jobTitle = job?.aiResponse?.jobTitle || "the position";

      if (candidate && candidate.email) {
        await sendMail({
          to: candidate.email,
          subject: `Update regarding your application for ${jobTitle}`,
          body: `Dear ${candidate.name},\n\nThank you for taking the time to interview with us for the ${jobTitle} position. While we were impressed with your background, we have decided to move forward with another candidate.\n\nBest regards,\nHR Team | Aurion AI`,
          relatedModule: "hiring",
          refModel: "Candidate",
          refId: candidate._id
        });
        candidate.status = "rejected";
        await candidate.save();
      }
      return { success: true, message: `Candidate has been warmly rejected and notified.` };
    }
    return { success: false, message: "Invalid decision. Use 'hire' or 'reject'." };
  } catch (error) {
    console.error("Error finalizing candidate:", error.message);
    return { success: false, message: error.message };
  }
};

export const submitInterviewFeedback = async (interviewId, interviewerId, comments, rating, recommendation) => {
  try {
    const interview = await InterviewSchedule.findByIdAndUpdate(
      interviewId,
      {
        status: "completed",
        feedback: {
          interviewer_id: interviewerId,
          comments,
          rating,
          recommendation
        }
      },
      { new: true }
    ).populate('candidate_id job_id');

    if (!interview) return { success: false, message: "Interview record not found." };
    
    return { 
      success: true, 
      message: `Feedback recorded for candidate ${interview.candidate_id?.name}. Interview status set to Completed.`,
      data: interview 
    };
  } catch (error) {
    console.error("Error in submitInterviewFeedback tool:", error.message);
    return { success: false, message: error.message };
  }
};
