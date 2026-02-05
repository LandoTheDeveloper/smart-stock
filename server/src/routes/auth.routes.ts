import express from 'express';
import { register, login, getProfile, verifyEmail, resendVerification } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getProfile);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

export default router;