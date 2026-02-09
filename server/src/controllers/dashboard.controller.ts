import { Request, Response } from 'express';
import PantryItem from '../models/PantryItem';
import { getHouseholdContext, buildHouseholdQuery } from '../utils/household.utils';

export const getOverview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

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

    const now = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(now.getDate() + 5);

    const allItems = await PantryItem.find(buildHouseholdQuery(context)).sort({ lastUpdated: -1 });


const lowStockItems = allItems.filter(item => item.quantity <= 2);

const topLowStockItems = [...lowStockItems] // avoid mutating lowStockItems
  .sort((a, b) => a.quantity - b.quantity)
  .slice(0, 5)
  .map(item => ({
    id: String(item._id),
    item: item.name,
    qty: item.quantity,
    unit: item.unit || 'count'
  }));



    const expiringSoonItems = allItems.filter(item => {
      if (!item.expirationDate) return false;
      return item.expirationDate <= fiveDaysFromNow;
    });

    const recentActivity = allItems.slice(0, 10).map(item => {
      let status: 'ok' | 'warn' | 'danger' = 'ok';

      if (item.expirationDate) {
        const daysUntilExpiry = Math.ceil((item.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 2) {
          status = 'danger';
        } else if (daysUntilExpiry <= 5) {
          status = 'warn';
        }
      }

      return {
        id: item._id,
        item: item.name,
        qty: item.quantity,
        unit: item.unit || 'count',
        expires: item.expirationDate
          ? item.expirationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: item.expirationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
          : 'N/A',
        status
      };
    });

    const locationCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    for (const item of allItems) {
      const loc = item.storageLocation || 'Pantry';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;

      const cat = item.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        lowStock: lowStockItems.length,
        lowStockItems: topLowStockItems,
        expiringSoon: expiringSoonItems.length,
        pantrySize: allItems.length,
        recentActivity,
        locationCounts,
        categoryCounts
      }
    });
  } catch (error: any) {
    console.error('Error fetching overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview data',
      error: error.message
    });
  }
};
