import { Request, Response } from 'express';
import SavedRecipe from '../models/SavedRecipe';

export const getAllRecipes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { favorites, custom } = req.query;

    const filter: any = { userId };
    if (favorites === 'true') filter.isFavorite = true;
    if (custom === 'true') filter.isCustom = true;

    const recipes = await SavedRecipe.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: recipes
    });
  } catch (error: any) {
    console.error('Error fetching saved recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved recipes',
      error: error.message
    });
  }
};

export const getRecipeById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const recipe = await SavedRecipe.findOne({ _id: id, userId });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      data: recipe
    });
  } catch (error: any) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipe',
      error: error.message
    });
  }
};

export const saveRecipe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { title, minutes, servings, tags, kcal, protein, carbs, fat, ingredients, steps, isCustom, notes } = req.body;

    if (!title || !ingredients || !steps) {
      return res.status(400).json({
        success: false,
        message: 'Title, ingredients, and steps are required'
      });
    }

    // Check for duplicate recipe by title (case-insensitive)
    const existingRecipe = await SavedRecipe.findOne({
      userId,
      title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (existingRecipe) {
      return res.status(409).json({
        success: false,
        message: 'You already have a recipe with this title saved'
      });
    }

    const recipe = new SavedRecipe({
      userId,
      title,
      minutes: minutes || 0,
      servings: servings || 1,
      tags: tags || [],
      kcal: kcal || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      ingredients,
      steps,
      isCustom: isCustom || false,
      notes
    });

    await recipe.save();

    res.status(201).json({
      success: true,
      data: recipe,
      message: 'Recipe saved'
    });
  } catch (error: any) {
    console.error('Error saving recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save recipe',
      error: error.message
    });
  }
};

export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const recipe = await SavedRecipe.findOne({ _id: id, userId });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    const { title, minutes, servings, tags, kcal, protein, carbs, fat, ingredients, steps, notes } = req.body;

    if (title !== undefined) recipe.title = title;
    if (minutes !== undefined) recipe.minutes = minutes;
    if (servings !== undefined) recipe.servings = servings;
    if (tags !== undefined) recipe.tags = tags;
    if (kcal !== undefined) recipe.kcal = kcal;
    if (protein !== undefined) recipe.protein = protein;
    if (carbs !== undefined) recipe.carbs = carbs;
    if (fat !== undefined) recipe.fat = fat;
    if (ingredients !== undefined) recipe.ingredients = ingredients;
    if (steps !== undefined) recipe.steps = steps;
    if (notes !== undefined) recipe.notes = notes;

    await recipe.save();

    res.json({
      success: true,
      data: recipe,
      message: 'Recipe updated'
    });
  } catch (error: any) {
    console.error('Error updating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recipe',
      error: error.message
    });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const recipe = await SavedRecipe.findOne({ _id: id, userId });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    recipe.isFavorite = !recipe.isFavorite;
    await recipe.save();

    res.json({
      success: true,
      data: recipe,
      message: recipe.isFavorite ? 'Added to favorites' : 'Removed from favorites'
    });
  } catch (error: any) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle favorite',
      error: error.message
    });
  }
};

export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const recipe = await SavedRecipe.findOneAndDelete({ _id: id, userId });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      message: 'Recipe deleted'
    });
  } catch (error: any) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipe',
      error: error.message
    });
  }
};
