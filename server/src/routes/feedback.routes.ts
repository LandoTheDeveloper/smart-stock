// backend/src/routes/feedback.routes.ts
import express from 'express';
import {
  submitFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} from '../controllers/feedback.controller';
// import { authenticate } from '../middleware/auth'; // Uncomment if you want to protect these routes

const router = express.Router();

console.log('📝 Feedback routes file loaded');

// Public route - no auth needed for submitting feedback
router.post('/', submitFeedback);

// Admin routes - add authentication middleware if needed
// router.get('/', authenticate, getAllFeedback);
// router.patch('/:id/status', authenticate, updateFeedbackStatus);
// router.delete('/:id', deleteFeedback);

// For now, without auth (you can add auth later):
router.get('/', getAllFeedback);
router.patch('/:id/status', updateFeedbackStatus);
router.delete('/:id', deleteFeedback);

export default router;