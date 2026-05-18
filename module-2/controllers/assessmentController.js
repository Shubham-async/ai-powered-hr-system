import CandidateTest from "../models/Candidate Assessment Models/CandidateTestModel.js";
import CandidateScore from "../models/Candidate Assessment Models/CandidateScoreModel.js";
import ShortlistedCandidate from "../models/Resume Screening Models/ShortlistedCandidatesModel.js";
import Candidate from "../models/candidateModel.js";
import JD from "../models/jdModel.js";
import User from "../models/User.js";
import { generateAssessmentQuestions } from "../services/aiService.js";
import { sendMail } from "../tools/mailTools.js";

export const initAssessment = async (req, res) => {
  try {
    const { candidate_id, job_id, role, skills, test_type = "MCQ" } = req.body;
    
    // 🧠 Generate Questions using AI
    const questions = await generateAssessmentQuestions(role, skills || []);
    const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

    const newTest = await CandidateTest.create({
      candidate_id,
      job_id,
      test_type,
      test_status: "pending",
      total_marks: totalMarks,
      questions: questions,
    });

    // Update candidate global status and send email
    const fullCandidate = await Candidate.findByIdAndUpdate(candidate_id, { status: "assessment" });
    
    if (fullCandidate && fullCandidate.email) {
      const job = await JD.findById(job_id);
      const jobTitle = job?.aiResponse?.jobTitle || role || "the position";
      
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
        subject: `Next Steps: Technical Assessment for ${jobTitle}`,
        body: `Hello ${fullCandidate.name},\n\nCongratulations! Your profile has been shortlisted for the ${jobTitle} position.\n\nAs the next step, we have initialized a technical assessment for you.\n\nPlease log in to the Candidate Portal to begin your test:\n🔗 Portal Link: http://localhost:5173/auth/candidate\n👤 Login ID: ${fullCandidate.email}\n🔑 Password: ${tempPassword}\n\nBest of luck!\n\nHR Team | Aurion AI`,
        relatedModule: "hiring",
        refModel: "Candidate",
        refId: fullCandidate._id
      });
      console.log(`📧 Manual Assessment notification sent to: ${fullCandidate.email}`);
    }

    // NOTE: Simplified version without background queue for now
    res.status(201).json({
      success: true,
      message: "AI assessment initialized.",
      test_id: newTest._id,
      status: "in_progress",
    });
  } catch (error) {
    console.error("Assessment Init Error:", error);
    res.status(500).json({ success: false, message: "Failed to initialize test" });
  }
};

export const getTestDetails = async (req, res) => {
  try {
    const { candidate_id } = req.query;
    const test = await CandidateTest.findOne({
      candidate_id,
      test_status: { $in: ["pending", "in_progress"] },
    });

    if (!test) return res.status(404).json({ success: false, message: "No test found" });
    res.status(200).json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTestById = async (req, res) => {
  try {
    const test = await CandidateTest.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });
    res.status(200).json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const submitAssessment = async (req, res) => {
  try {
    const { test_id, responses } = req.body;
    const test = await CandidateTest.findById(test_id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    // Local evaluation logic
    let obtained = 0;
    test.questions = test.questions.map((q) => {
      const response = responses.find((r) => r.question_id === q.question_id);
      if (response) {
        q.selected_answer = response.answer;
        q.is_correct = q.correct_answer === response.answer;
        if (q.is_correct) obtained += q.marks;
      }
      return q;
    });

    test.total_marks = obtained; // Simplified
    test.test_status = "completed";
    test.completed_at = new Date();
    await test.save();

    const scoreDoc = await CandidateScore.create({
      candidate_id: test.candidate_id,
      job_id: test.job_id,
      test_id: test._id,
      total_score: obtained,
      percentage: (obtained / (test.questions.length || 1)) * 100,
    });

    res.status(200).json({ success: true, score: scoreDoc });
  } catch (error) {
    console.error("Submit Test Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getShortlistedWithScores = async (req, res) => {
  try {
    const shortlisted = await CandidateScore.find().populate("candidate_id job_id");
    res.status(200).json({ success: true, total: shortlisted.length, shortlisted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAssessmentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await CandidateScore.findById(id).populate("candidate_id job_id");
    if (!detail) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, shortlisted: detail });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyAssessments = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: "Unauthorized" });
    
    // Find Candidate by matching email of the logged in User
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const candidate = await Candidate.findOne({ email: user.email });
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate profile not found" });

    // Fetch tests for this candidate
    const tests = await CandidateTest.find({ candidate_id: candidate._id }).populate("job_id");
    
    res.status(200).json({ success: true, count: tests.length, tests });
  } catch (error) {
    console.error("Get My Assessments Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
