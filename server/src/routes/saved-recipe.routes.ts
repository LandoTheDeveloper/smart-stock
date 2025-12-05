import express from 'express';
import {
  getAllRecipes,
  getRecipeById,
  saveRecipe,
  updateRecipe,
  toggleFavorite,
  deleteRecipe
} from '../controllers/saved-recipe.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, getAllRecipes);
router.get('/:id', authenticate, getRecipeById);
router.post('/', authenticate, saveRecipe);
router.put('/:id', authenticate, updateRecipe);
router.put('/:id/favorite', authenticate, toggleFavorite);
router.delete('/:id', authenticate, deleteRecipe);

export default router;
