import { Request, Response } from 'express';
import RecipeHistory from '../models/RecipeHistory';
import { getHouseholdContext, buildHouseholdQuery } from '../utils/household.utils';

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const context = await getHouseholdContext(userId);
    if (!context) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const history = await RecipeHistory.find(buildHouseholdQuery(context))
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Get Recipe History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipe history',
      error: error.message
    });
  }
};

export const deleteHistoryItem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const context = await getHouseholdContext(userId);
    if (!context) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const query = { _id: id, ...buildHouseholdQuery(context) };
    const item = await RecipeHistory.findOneAndDelete(query);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'History item not found'
      });
    }

    res.json({
      success: true,
      message: 'History item deleted'
    });
  } catch (error: any) {
    console.error('Delete Recipe History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting history item',
      error: error.message
    });
  }
};

export const clearHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const context = await getHouseholdContext(userId);
    if (!context) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    await RecipeHistory.deleteMany(buildHouseholdQuery(context));

    res.json({
      success: true,
      message: 'History cleared'
    });
  } catch (error: any) {
    console.error('Clear Recipe History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing history',
      error: error.message
    });
  }
};
