import mongoose from 'mongoose';
import CandidateApplied from '../models/candidateAppliedModel.js';
import resumeQueue from '../queues/resumeShortListQueue.js';
import CandidateModel from '../models/candidateModel.js';
import ShortlistedCandidatesModel from '../models/Resume Screening Models/ShortlistedCandidatesModel.js';

export const applyToJob = async (req, res) => {
  try {
    const { job_id, name, email } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    // Validation for valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(job_id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid Job ID format. Please ensure you are applying to a valid job listing." 
      });
    }

    const newApplication = new CandidateApplied({
      resume: req.file.path,
      job_id: job_id
    });

    await newApplication.save();
    
    // Add to queue for background processing (extraction and shortlisting)
    resumeQueue.add('resumeExtractQueue', { jdId: job_id });
    
    res.status(201).json({ 
      success: true, 
      message: "Application submitted successfully!",
      data: newApplication 
    });
  } catch (error) {
    console.error("Error applying to job:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const shortlistCandidates = async (req, res) => {
  try {
    const { jdId } = req.body;
    if (!jdId) return res.status(400).json({ message: "jdId is required" });

    await resumeQueue.add('resumeShortlistQueue', { jdId });
    return res.status(200).json({ success: true, message: "Resume shortlisting in progress" });
  } catch (error) {
    console.error("Error in shortlistController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCandidates = async (req, res) => {
  try {
    const { jdId } = req.params;
    let candidates;
    if (!jdId || jdId === 'all') {
      candidates = await CandidateModel.find();
    } else {
      candidates = await CandidateModel.find({ job_id: jdId });
    }
    return res.status(200).json({ success: true, data: candidates });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getShortlistedCandidates = async (req, res) => {
  try {
    const { jdId } = req.params;
    let candidates;
    if (!jdId || jdId === 'all') {
      candidates = await ShortlistedCandidatesModel.find().populate("candidateId");
    } else {
      candidates = await ShortlistedCandidatesModel.find({ jobId: jdId }).populate("candidateId");
    }
    return res.status(200).json({ success: true, data: candidates });
  } catch (error) {
    console.error("Error fetching shortlisted candidates:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
