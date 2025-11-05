import express from 'express';
import { generateContent } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Optionally protect with authentication
router.post('/', authenticate, generateContent);

export default router;