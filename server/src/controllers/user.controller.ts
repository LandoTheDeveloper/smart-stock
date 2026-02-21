import { Request, Response } from 'express';
import User from '../models/User';
import PantryItem from '../models/PantryItem';
import { getHouseholdContext, buildHouseholdQuery } from '../utils/household.utils';

// Conversion factors to base unit (g for solids, ml for liquids)
const SOLID_FACTORS: Record<string, number> = {
  g: 1, kg: 1000, oz: 28.3495, lb: 453.592,
};
const LIQUID_FACTORS: Record<string, number> = {
  ml: 1, L: 1000, cups: 236.588, oz: 29.5735, tbsp: 14.787, tsp: 4.929,
};

export const getPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.preferences || {
        dietaryPreferences: [],
        allergies: [],
        customAllergies: '',
        avoidIngredients: '',
        calorieTarget: 0,
        proteinTarget: 0,
        cuisinePreferences: '',
        defaultUnits: { solid: 'g', liquid: 'ml', countable: 'count' },
        lowStockThresholds: { solid: 200, liquid: 500, countable: 2 }
      }
    });
  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const {
      dietaryPreferences,
      allergies,
      customAllergies,
      avoidIngredients,
      calorieTarget,
      proteinTarget,
      cuisinePreferences,
      defaultUnits,
      lowStockThresholds
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const existingDefaults = user.preferences?.defaultUnits
      ? { solid: user.preferences.defaultUnits.solid || 'g', liquid: user.preferences.defaultUnits.liquid || 'ml', countable: user.preferences.defaultUnits.countable || 'count' }
      : { solid: 'g', liquid: 'ml', countable: 'count' };
    const newDefaults = defaultUnits || existingDefaults;
    const unitsChanged = defaultUnits !== undefined;

    user.preferences = {
      dietaryPreferences: dietaryPreferences ?? user.preferences?.dietaryPreferences ?? [],
      allergies: allergies ?? user.preferences?.allergies ?? [],
      customAllergies: customAllergies ?? user.preferences?.customAllergies ?? '',
      avoidIngredients: avoidIngredients ?? user.preferences?.avoidIngredients ?? '',
      calorieTarget: calorieTarget ?? user.preferences?.calorieTarget ?? 0,
      proteinTarget: proteinTarget ?? user.preferences?.proteinTarget ?? 0,
      cuisinePreferences: cuisinePreferences ?? user.preferences?.cuisinePreferences ?? '',
      defaultUnits: newDefaults,
      lowStockThresholds: lowStockThresholds || (user.preferences?.lowStockThresholds
        ? { solid: user.preferences.lowStockThresholds.solid ?? 200, liquid: user.preferences.lowStockThresholds.liquid ?? 500, countable: user.preferences.lowStockThresholds.countable ?? 2 }
        : { solid: 200, liquid: 500, countable: 2 })
    };

    user.markModified('preferences');
    await user.save();

    // Convert ALL existing pantry items to match new default units (only if units were changed)
    const context = await getHouseholdContext(userId);
    if (context && unitsChanged) {
      const baseQuery = buildHouseholdQuery(context);

      // Solid units: convert any non-target solid unit to the new default
      const solidTarget = newDefaults.solid;
      if (SOLID_FACTORS[solidTarget]) {
        for (const fromUnit of ['g', 'kg', 'oz', 'lb']) {
          if (fromUnit === solidTarget) continue;
          if (!SOLID_FACTORS[fromUnit]) continue;
          const ratio = SOLID_FACTORS[fromUnit] / SOLID_FACTORS[solidTarget];
          const items = await PantryItem.find({ ...baseQuery, unit: fromUnit });
          for (const item of items) {
            item.quantity = Math.round(item.quantity * ratio * 100) / 100;
            item.unit = solidTarget;
            await item.save();
          }
        }
      }

      // Liquid units: convert any non-target liquid unit to the new default
      const liquidTarget = newDefaults.liquid;
      if (LIQUID_FACTORS[liquidTarget]) {
        for (const fromUnit of ['ml', 'L', 'cups', 'oz', 'tbsp', 'tsp']) {
          if (fromUnit === liquidTarget) continue;
          if (!LIQUID_FACTORS[fromUnit]) continue;
          const ratio = LIQUID_FACTORS[fromUnit] / LIQUID_FACTORS[liquidTarget];
          const items = await PantryItem.find({ ...baseQuery, unit: fromUnit });
          for (const item of items) {
            item.quantity = Math.round(item.quantity * ratio * 100) / 100;
            item.unit = liquidTarget;
            await item.save();
          }
        }
      }

      // Countable units: just swap the label (no quantity conversion)
      const countableTarget = newDefaults.countable;
      for (const fromUnit of ['count', 'pcs', 'pack', 'box', 'can', 'bottle', 'bag']) {
        if (fromUnit === countableTarget) continue;
        await PantryItem.updateMany(
          { ...baseQuery, unit: fromUnit },
          { $set: { unit: countableTarget } }
        );
      }
    }

    res.json({
      success: true,
      data: user.preferences
    });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
};
