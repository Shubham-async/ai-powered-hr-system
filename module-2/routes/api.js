import { Router } from "express";
import VoiceRouter from "./process/voiceRoutes.js";
import test from "./test.js";
import agentRouter from "./agentRoutes.js";

// ─── New feature routers ───────────────────────────────────────────────────────
import leaveRouter from "./leaveRoutes.js";
import projectRouter from "./projectRoutes.js";
import analyticsRouter from "./analyticsRoutes.js";
import mailRouter from "./mailRoutes.js";
import notificationRouter from "./notificationRoutes.js";
import hiringRouter from "./hiringRoutes.js";
import authRouter from "./authRoutes.js";

import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ─── Health ────────────────────────────────────────────────────────────────────
router.get('/healthz', (req, res) => {
  res.json({ status: 'API is healthy', timestamp: new Date().toISOString() });
});

// ─── Core AI agent ────────────────────────────────────────────────────────────
router.use('/auth', authRouter);
router.use('/agent', agentRouter);
router.use('/test', test);
router.use('/process', VoiceRouter);

// ─── HR Feature Modules (Protected) ───────────────────────────────────────────
router.use('/leave', authenticate, leaveRouter);
router.use('/projects', authenticate, projectRouter);
router.use('/analytics', authenticate, requireRole('hr', 'admin'), analyticsRouter);
router.use('/mail', authenticate, requireRole('hr', 'admin'), mailRouter);
router.use('/notifications', authenticate, notificationRouter);
router.use('/hiring', hiringRouter);

export default router;