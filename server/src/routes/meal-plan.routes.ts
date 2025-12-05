import express from 'express';
import {
  getMealPlans,
  addMealPlan,
  updateMealPlan,
  toggleMealCompleted,
  deleteMealPlan,
  getIngredientComparison,
  generateShoppingList
} from '../controllers/meal-plan.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, getMealPlans);
router.post('/', authenticate, addMealPlan);
router.get('/ingredients', authenticate, getIngredientComparison);
router.post('/generate-shopping-list', authenticate, generateShoppingList);
router.put('/:id', authenticate, updateMealPlan);
router.put('/:id/toggle', authenticate, toggleMealCompleted);
router.delete('/:id', authenticate, deleteMealPlan);

export default router;
