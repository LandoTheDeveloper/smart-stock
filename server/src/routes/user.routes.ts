import express from 'express';
import { getPreferences, updatePreferences } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/preferences', authenticate, getPreferences);
router.put('/preferences', authenticate, updatePreferences);

export default router;
