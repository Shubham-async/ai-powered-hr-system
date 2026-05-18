import { Router } from 'express';
import { register, login, getMe, getAllEmployees } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/employees', authenticate, getAllEmployees);

export default router;
