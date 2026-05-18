import { Router } from 'express';
import * as mailCtrl from '../controllers/mailController.js';
const router = Router();

router.post('/send', mailCtrl.sendMail);
router.get('/all', mailCtrl.getAllMail);
router.get('/employee/:employeeId', mailCtrl.getEmployeeMail);

export default router;
