import jdModel from "../models/jdModel.js";
import Candidate from "../models/candidateModel.js";
import shortListedCandidateModel from "../models/Resume Screening Models/ShortlistedCandidatesModel.js";
import { getCandidateDetailsFromResume, shortListedCandidatesForJD, generateAssessmentQuestions } from "./aiService.js";
import candidateAppliedModel from "../models/candidateAppliedModel.js";
import CandidateTest from "../models/Candidate Assessment Models/CandidateTestModel.js";
import { sendMail } from "../tools/mailTools.js";
import { updateTask } from "../utils/taskProgress.js";
import User from "../models/User.js";
import fs from "fs";
import path from "path";

// Utility: timeout wrapper
function withTimeout(promise, ms, msg = "Operation timed out") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);
}

const isUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const resolveResumeSource = (resume) => {
  if (isUrl(resume)) return resume;
  const absolutePath = path.resolve("", resume);
  if (!fs.existsSync(absolutePath)) throw new Error(`Resume file not found at ${absolutePath}`);
  return absolutePath;
};

export const processAppliedCandidatesForJD = async (jdId) => {
  try {
    const job = await jdModel.findById(jdId);
    if (!job) throw new Error("Job Description not found");

    console.log("🚀 Processing applied candidates for JD:", jdId);
    updateTask(jdId, 5, "Initializing resume extraction...");
    const appliedCandidates = await candidateAppliedModel.find({ job_id: jdId });

    if (!appliedCandidates.length) return { message: "No candidates to process." };

    const results = await Promise.allSettled(
      appliedCandidates.map(async (candidate) => {
        try {
          // 1. Check if we already have a structured Candidate for this raw application
          const existingCandidate = await Candidate.findOne({ 
            job_id: jdId,
            $or: [
              { resume: candidate.resume },
              { candidate_applied_id: candidate._id } // Link to source
            ]
          });
          
          if (existingCandidate) {
            console.log(`⏩ Skipping duplicate for application ${candidate._id}`);
            return existingCandidate;
          }

          let resumeSource = resolveResumeSource(candidate.resume);
          let buffer = null;
          if (!isUrl(resumeSource)) buffer = await fs.promises.readFile(resumeSource);

          const candidateDetails = await withTimeout(
            getCandidateDetailsFromResume(jdId, resumeSource, buffer),
            60000,
            "Resume parsing timeout"
          );

          console.log(`✨ AI Extracted: ${candidateDetails.name} (${candidateDetails.email})`);

          const newCandidate = new Candidate({
            ...candidateDetails,
            job_id: jdId,
            candidate_applied_id: candidate._id, // Back-reference
            resume: candidate.resume,
            resume_source_type: isUrl(candidate.resume) ? "url" : "upload",
            status: "new"
          });

          await withTimeout(newCandidate.save(), 30000, "Candidate save timeout");
          console.log(`✅ Candidate ${candidateDetails.name} saved to database.`);
          return newCandidate;
        } catch (err) {
          console.error(`❌ Failed to process application ${candidate._id}:`, err.message);
          throw err;
        }
      })
    );

    updateTask(jdId, 95, "Completing extraction...");
    return { message: "Candidate processing completed.", totalProcessed: results.length, totalSaved: results.filter(r => r.status === "fulfilled").length };
  } catch (error) {
    console.error("💥 Error while processing candidates:", error);
    throw error;
  }
};

const shortlistCandidatesForJD = async (jdId) => {
  try {
    const job = await jdModel.findById(jdId);
    if (!job) throw new Error("Job Description not found");

    console.log("🏅 Starting AI shortlisting for JD:", jdId);
    updateTask(jdId, 10, "Scanning candidate profiles...");
    
    // Safety Check: Get IDs of candidates already processed for this JD
    const processedCandidateIds = await shortListedCandidateModel.find({ jobId: jdId }).distinct('candidateId');
    const processedIdsStrings = processedCandidateIds.map(id => id.toString());

    const savedCandidates = await Candidate.find({ job_id: jdId });
    
    // Only process candidates that haven't been evaluated yet
    const candidatesToProcess = savedCandidates.filter(c => !processedIdsStrings.includes(c._id.toString()));

    if (!candidatesToProcess.length) {
      return { message: "No new candidates available for shortlisting. All candidates have already been evaluated." };
    }

    console.log(`🤖 Sending ${candidatesToProcess.length} new candidates to AI for evaluation...`);
    updateTask(jdId, 40, `AI is evaluating ${candidatesToProcess.length} candidates...`);

    const shortlistedList = await withTimeout(
      shortListedCandidatesForJD(candidatesToProcess, job),
      120000,
      "AI shortlisting timeout"
    );

    const saveResults = await Promise.allSettled(
      shortlistedList.map(async (data) => {
        // Fix jobId consistency (ShortlistedCandidatesModel uses jobId)
        const shortlisted = new shortListedCandidateModel({ ...data, jobId: jdId });
        await shortlisted.save();

        if (data.status === "shortlisted") {
          try {
            console.log(`📡 Auto-initializing assessment for candidate: ${data.candidateId}`);
            
            // 🧠 Generate Questions using AI for the required role
            const questions = await generateAssessmentQuestions(job.role || job.title, []);
            const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

            await CandidateTest.create({
              candidate_id: data.candidateId,
              job_id: jdId,
              test_type: "MCQ",
              test_status: "pending",
              total_marks: totalMarks,
              questions: questions,
            });

            // Update candidate global status
            const fullCandidate = await Candidate.findByIdAndUpdate(data.candidateId, { status: "assessment" });
            console.log(`✅ Assessment check initialized for candidate: ${data.candidateId}`);

            // 📧 Send Notification Mail
            if (fullCandidate && fullCandidate.email) {
              const tempPassword = Math.random().toString(36).slice(-8); // Generate random temp password
              
              // Upsert User record for Candidate Portal
              let userRecord = await User.findOne({ email: fullCandidate.email });
              if (userRecord) {
                userRecord.password = tempPassword;
                await userRecord.save();
              } else {
                await User.create({ email: fullCandidate.email, name: fullCandidate.name, password: tempPassword, role: "candidate" });
              }

              await sendMail({
                to: fullCandidate.email,
                subject: `Next Steps: Technical Assessment for ${job.role || job.title}`,
                body: `Hello ${fullCandidate.name},\n\nCongratulations! Your profile has been shortlisted for the ${job.role || job.title} position.\n\nAs the next step, we have initialized a technical assessment for you.\n\nPlease log in to the Candidate Portal to begin your test:\n🔗 Portal Link: http://localhost:5173/auth/candidate\n👤 Login ID: ${fullCandidate.email}\n🔑 Password: ${tempPassword}\n\nBest of luck!\n\nHR Team | Aurion AI`,
                relatedModule: "hiring",
                refModel: "Candidate",
                refId: fullCandidate._id
              });
              console.log(`📧 Shortlist notification sent to: ${fullCandidate.email}`);
            }
          } catch (error) {
            console.error(`❌ Failed to auto-initialize assessment for candidate ${data.candidateId}:`, error.message);
          }
        }
      })
    );

    updateTask(jdId, 100, "Shortlisting and Assessment Initialization Complete", "completed");
    return { message: "Shortlisting process completed.", totalShortlisted: saveResults.filter(r => r.status === "fulfilled").length };
  } catch (error) {
    console.error("💥 Error during shortlisting:", error);
    throw error;
  }
};

export default shortlistCandidatesForJD;
