import { Router } from 'express';
import * as notifCtrl from '../controllers/notificationController.js';
const router = Router();

router.get('/:employeeId', notifCtrl.getNotifications);
router.patch('/:employeeId/read-all', notifCtrl.markAllAsRead);
router.patch('/single/:notificationId/read', notifCtrl.markAsRead);

export default router;
