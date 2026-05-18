import { Router } from 'express';
import * as leaveCtrl from '../controllers/leaveController.js';
const router = Router();

router.post('/request', leaveCtrl.requestLeave);
router.get('/all', leaveCtrl.getAllLeaves);
router.get('/pending', leaveCtrl.getPendingLeaves);
router.get('/status/:employeeId', leaveCtrl.getLeaveStatus);
router.get('/balance/:employeeId', leaveCtrl.getLeaveBalance);
router.patch('/:leaveId/respond', leaveCtrl.respondToLeave);

export default router;
