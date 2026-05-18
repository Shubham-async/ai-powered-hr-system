import { Router } from "express";
import multer from 'multer';
import fs from 'fs';
import { applyToJob, shortlistCandidates, getAllCandidates, getShortlistedCandidates } from '../controllers/hiringController.js';
import { generateJD, getAllJDs, getJDById, updateJD, deleteJD } from '../controllers/jobController.js';
import { jdPostController } from '../controllers/jdPostController.js';
import { scheduleInterview, getInterviews, updateInterviewStatus, submitInterviewFeedback } from '../controllers/interviewController.js';
import { initAssessment, getTestDetails, getTestById, submitAssessment, getShortlistedWithScores, getAssessmentDetail, getMyAssessments } from '../controllers/assessmentController.js';
import { createOffer, getOffers, updateOfferStatus, createOnboardingTask, getOnboardingTasks, rejectCandidate } from '../controllers/offerController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Configure Multer for resume uploads
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// --- Candidates & Application ---
router.post('/apply', upload.single('resume'), applyToJob);
router.post('/shortlist', shortlistCandidates);
router.get('/getAllCandidates/:jdId', getAllCandidates);
router.get('/getAllShortListedCandidates/:jdId', getShortlistedCandidates);

// --- Job Descriptions (JD) ---
router.post('/jd/generate', generateJD);
router.get('/jd/all', getAllJDs);
router.get('/jd/:id', getJDById);
router.patch('/jd/:id', updateJD);
router.post('/jd/update', updateJD); // For legacy body-based updates
router.delete('/jd/:id', deleteJD);
router.post('/jd/delete', deleteJD); // For legacy body-based deletes
router.post('/jd/:id/post', jdPostController);

// --- Interview Scheduling ---
router.post('/interviews/schedule', scheduleInterview);
router.get('/interviews/all/:jobId', getInterviews);
router.put('/interviews/status/:id', updateInterviewStatus);
router.post('/interviews/feedback/:id', submitInterviewFeedback);

// --- Assessment ---
router.post('/assessments/init', initAssessment);
router.get('/assessments/my-tests', authenticate, getMyAssessments);
router.get('/assessments/test', getTestDetails);
router.get('/assessments/test/:id', authenticate, getTestById);
router.post('/assessments/submit', submitAssessment);
router.get('/assessments/shortlisted', getShortlistedWithScores);
router.get('/assessments/shortlisted/:id', getAssessmentDetail);

// --- Offers ---
router.post('/offers/create', createOffer);
router.post('/offers/reject', rejectCandidate);
router.get('/offers/list', getOffers);
router.put('/offers/status/:id', updateOfferStatus);
router.post('/offers/onboarding/create', createOnboardingTask);
router.get('/offers/onboarding/:candidate_id', getOnboardingTasks);

export default router;
