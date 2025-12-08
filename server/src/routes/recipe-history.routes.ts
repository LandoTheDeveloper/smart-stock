import express from 'express';
import { getHistory, deleteHistoryItem, clearHistory } from '../controllers/recipe-history.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, getHistory);
router.delete('/:id', authenticate, deleteHistoryItem);
router.delete('/', authenticate, clearHistory);

export default router;
