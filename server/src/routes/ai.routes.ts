import express from 'express';
import { generateContent, generateRecipes } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', authenticate, generateContent);
router.post('/recipes', authenticate, generateRecipes);
router.post('/generate-recipes', authenticate, generateRecipes); // Alias for mobile app
export default router;
