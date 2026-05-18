import { Router } from 'express';
import * as analyticsCtrl from '../controllers/analyticsController.js';
const router = Router();

router.get('/kpis', analyticsCtrl.getKPIs);
router.get('/hiring-funnel', analyticsCtrl.getHiringFunnel);
router.get('/leave-heatmap', analyticsCtrl.getLeaveHeatmap);
router.get('/project-health', analyticsCtrl.getProjectHealth);
router.get('/headcount', analyticsCtrl.getHeadcount);
router.get('/leave-distribution', analyticsCtrl.getLeaveDistribution);
router.get('/onboarding', analyticsCtrl.getOnboardingStats);

export default router;
