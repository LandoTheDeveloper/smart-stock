import express from 'express';
import authRoutes from './auth.routes';
import aiRoutes from './ai.routes';
import dashboardRoutes from './dashboard.routes';
import pantryRoutes from './pantry.routes';
import shoppingListRoutes from './shopping-list.routes';
import mealPlanRoutes from './meal-plan.routes';
import savedRecipeRoutes from './saved-recipe.routes';
import userRoutes from './user.routes';
import recipeHistoryRoutes from './recipe-history.routes';
import householdRoutes from './household.routes';
import feedbackRoutes from './feedback.routes'

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/generate', aiRoutes);
router.use('/ai', aiRoutes); // Alias for mobile app: /api/ai/generate-recipes
router.use('/dashboard', dashboardRoutes);
router.use('/pantry', pantryRoutes);
router.use('/shopping-list', shoppingListRoutes);
router.use('/meal-plans', mealPlanRoutes);
router.use('/recipes', savedRecipeRoutes);
router.use('/saved-recipes', savedRecipeRoutes); // Alias for mobile app compatibility
router.use('/user', userRoutes);
router.use('/recipe-history', recipeHistoryRoutes);
router.use('/household', householdRoutes);
router.use('/feedback', feedbackRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;