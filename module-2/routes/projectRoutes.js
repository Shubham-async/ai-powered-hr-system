import { Router } from 'express';
import * as projectCtrl from '../controllers/projectController.js';
const router = Router();

router.post('/', projectCtrl.createProject);
router.get('/', projectCtrl.getAllProjects);
router.get('/employee/:employeeId', projectCtrl.getEmployeeProjects);
router.get('/:id', projectCtrl.getProject);
router.get('/:id/health-summary', projectCtrl.getHealthSummary);
router.post('/:id/members', projectCtrl.addMember);
router.post('/:id/milestones', projectCtrl.addMilestone);
router.patch('/:id/milestones/:milestoneId', projectCtrl.updateMilestone);
router.post('/:id/feedback', projectCtrl.submitFeedback);

router.patch('/:id', projectCtrl.updateProject);
router.delete('/:id', projectCtrl.deleteProject);

export default router;
