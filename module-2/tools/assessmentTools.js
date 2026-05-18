import CandidateTest from "../models/Candidate Assessment Models/CandidateTestModel.js";
import CandidateScore from "../models/Candidate Assessment Models/CandidateScoreModel.js";
import Candidate from "../models/candidateModel.js";
import { generateAssessmentQuestions } from "../services/aiService.js";

/**
 * Initialize an AI-driven assessment for a candidate.
 */
export const initAssessment = async (candidateId, jobId, role, skills = [], testType = "MCQ") => {
  try {
    // 🧠 Generate Questions using AI
    const questions = await generateAssessmentQuestions(role, skills);
    const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

    const newTest = await CandidateTest.create({
      candidate_id: candidateId,
      job_id: jobId,
      test_type: testType,
      test_status: "pending",
      total_marks: totalMarks,
      questions: questions,
    });

    // Update candidate status
    await Candidate.findByIdAndUpdate(candidateId, { status: "assessment" });

    return {
      success: true,
      message: `Assessment initialized for ${role}. ${questions.length} questions generated.`,
      testId: newTest._id
    };
  } catch (error) {
    console.error("Tool: initAssessment Error:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Get all assessment scores and results.
 */
export const getAssessmentResults = async (jobId = null) => {
  try {
    const filter = jobId ? { job_id: jobId } : {};
    const scores = await CandidateScore.find(filter).populate("candidate_id job_id").lean();
    
    return {
      success: true,
      count: scores.length,
      data: scores
    };
  } catch (error) {
    console.error("Tool: getAssessmentResults Error:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Get details of a specific test.
 */
export const getTestDetail = async (testId) => {
  try {
    const test = await CandidateTest.findById(testId).populate("candidate_id job_id").lean();
    if (!test) return { success: false, message: "Test not found." };
    
    return {
      success: true,
      data: test
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
