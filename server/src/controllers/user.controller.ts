import { Request, Response } from 'express';
import User from '../models/User';

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
        cuisinePreferences: ''
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
      cuisinePreferences
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.preferences = {
      dietaryPreferences: dietaryPreferences || [],
      allergies: allergies || [],
      customAllergies: customAllergies || '',
      avoidIngredients: avoidIngredients || '',
      calorieTarget: calorieTarget || 0,
      proteinTarget: proteinTarget || 0,
      cuisinePreferences: cuisinePreferences || ''
    };

    await user.save();

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
