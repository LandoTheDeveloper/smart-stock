import express from 'express';
import { getOverview } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/overview', authenticate, getOverview);

export default router;
