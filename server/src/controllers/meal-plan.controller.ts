import { Request, Response } from 'express';
import MealPlan from '../models/MealPlan';
import PantryItem from '../models/PantryItem';
import ShoppingListItem from '../models/ShoppingListItem';

export const getMealPlans = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : getStartOfWeek(new Date());
    const end = endDate
      ? new Date(endDate as string)
      : getEndOfWeek(new Date());

    const mealPlans = await MealPlan.find({
      userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1, mealType: 1 });

    res.json({
      success: true,
      data: mealPlans
    });
  } catch (error: any) {
    console.error('Error fetching meal plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plans',
      error: error.message
    });
  }
};

export const addMealPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { date, mealType, recipe, notes } = req.body;

    if (!date || !mealType || !recipe) {
      return res.status(400).json({
        success: false,
        message: 'Date, meal type, and recipe are required'
      });
    }

    const mealPlan = new MealPlan({
      userId,
      date: new Date(date),
      mealType,
      recipe,
      notes
    });

    await mealPlan.save();

    res.status(201).json({
      success: true,
      data: mealPlan,
      message: 'Meal added to plan'
    });
  } catch (error: any) {
    console.error('Error adding meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add meal to plan',
      error: error.message
    });
  }
};

export const updateMealPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const mealPlan = await MealPlan.findOne({ _id: id, userId });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    const { date, mealType, recipe, completed, notes } = req.body;

    if (date !== undefined) mealPlan.date = new Date(date);
    if (mealType !== undefined) mealPlan.mealType = mealType;
    if (recipe !== undefined) mealPlan.recipe = recipe;
    if (completed !== undefined) mealPlan.completed = completed;
    if (notes !== undefined) mealPlan.notes = notes;

    await mealPlan.save();

    res.json({
      success: true,
      data: mealPlan,
      message: 'Meal plan updated'
    });
  } catch (error: any) {
    console.error('Error updating meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meal plan',
      error: error.message
    });
  }
};

export const toggleMealCompleted = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const mealPlan = await MealPlan.findOne({ _id: id, userId });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    mealPlan.completed = !mealPlan.completed;
    await mealPlan.save();

    res.json({
      success: true,
      data: mealPlan,
      message: mealPlan.completed ? 'Meal marked as completed' : 'Meal marked as not completed'
    });
  } catch (error: any) {
    console.error('Error toggling meal completion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle meal completion',
      error: error.message
    });
  }
};

export const deleteMealPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const mealPlan = await MealPlan.findOneAndDelete({ _id: id, userId });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Meal removed from plan'
    });
  } catch (error: any) {
    console.error('Error deleting meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove meal from plan',
      error: error.message
    });
  }
};

export const getIngredientComparison = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : getStartOfWeek(new Date());
    const end = endDate
      ? new Date(endDate as string)
      : getEndOfWeek(new Date());

    const mealPlans = await MealPlan.find({
      userId,
      date: { $gte: start, $lte: end },
      completed: false
    });

    const ingredientMap = new Map<string, { name: string; amounts: string[] }>();

    for (const meal of mealPlans) {
      for (const ing of meal.recipe.ingredients) {
        const key = ing.name.toLowerCase().trim();
        if (ingredientMap.has(key)) {
          ingredientMap.get(key)!.amounts.push(ing.amount);
        } else {
          ingredientMap.set(key, { name: ing.name, amounts: [ing.amount] });
        }
      }
    }

    const pantryItems = await PantryItem.find({ userId });

    const comparison = [];
    for (const [key, value] of ingredientMap) {
      const pantryItem = pantryItems.find(
        p => p.name.toLowerCase().trim() === key
      );

      comparison.push({
        ingredient: value.name,
        amountsNeeded: value.amounts,
        inPantry: pantryItem ? {
          quantity: pantryItem.quantity,
          unit: pantryItem.unit
        } : null,
        status: pantryItem ? 'have' : 'need'
      });
    }

    res.json({
      success: true,
      data: {
        totalMeals: mealPlans.length,
        ingredients: comparison,
        needed: comparison.filter(c => c.status === 'need'),
        have: comparison.filter(c => c.status === 'have')
      }
    });
  } catch (error: any) {
    console.error('Error getting ingredient comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ingredient comparison',
      error: error.message
    });
  }
};

export const generateShoppingList = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { startDate, endDate } = req.body;

    const start = startDate
      ? new Date(startDate)
      : getStartOfWeek(new Date());
    const end = endDate
      ? new Date(endDate)
      : getEndOfWeek(new Date());

    const mealPlans = await MealPlan.find({
      userId,
      date: { $gte: start, $lte: end },
      completed: false
    });

    const ingredientMap = new Map<string, { name: string; amounts: string[] }>();

    for (const meal of mealPlans) {
      for (const ing of meal.recipe.ingredients) {
        const key = ing.name.toLowerCase().trim();
        if (ingredientMap.has(key)) {
          ingredientMap.get(key)!.amounts.push(ing.amount);
        } else {
          ingredientMap.set(key, { name: ing.name, amounts: [ing.amount] });
        }
      }
    }

    const pantryItems = await PantryItem.find({ userId });

    const existingShoppingItems = await ShoppingListItem.find({ userId });
    const existingNames = new Set(
      existingShoppingItems.map(i => i.name.toLowerCase().trim())
    );

    const newItems = [];
    for (const [key, value] of ingredientMap) {
      const inPantry = pantryItems.some(
        p => p.name.toLowerCase().trim() === key
      );
      const inShoppingList = existingNames.has(key);

      if (!inPantry && !inShoppingList) {
        const shoppingItem = new ShoppingListItem({
          userId,
          name: value.name,
          quantity: 1,
          unit: value.amounts.join(', '),
          category: 'Meal Plan',
          priority: 'normal'
        });
        await shoppingItem.save();
        newItems.push(shoppingItem);
      }
    }

    res.json({
      success: true,
      data: newItems,
      message: `Added ${newItems.length} items to shopping list from meal plan`
    });
  } catch (error: any) {
    console.error('Error generating shopping list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate shopping list',
      error: error.message
    });
  }
};

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date: Date): Date {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}
