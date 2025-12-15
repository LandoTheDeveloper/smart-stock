import { Request, Response } from 'express';
import ShoppingListItem from '../models/ShoppingListItem';
import PantryItem from '../models/PantryItem';
import { getHouseholdContext, buildHouseholdQuery, buildItemAttribution } from '../utils/household.utils';

export const getAllItems = async (req: Request, res: Response) => {
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

    const items = await ShoppingListItem.find(buildHouseholdQuery(context))
      .sort({ checked: 1, priority: -1, addedDate: -1 });

    res.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    console.error('Error fetching shopping list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shopping list',
      error: error.message
    });
  }
};

export const createItem = async (req: Request, res: Response) => {
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

    const { name, quantity, unit, category, priority, pantryItemId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required'
      });
    }

    const newItem = new ShoppingListItem({
      ...buildItemAttribution(context),
      name,
      quantity: quantity || 1,
      unit,
      category,
      priority: priority || 'normal',
      pantryItemId
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Item added to shopping list'
    });
  } catch (error: any) {
    console.error('Error creating shopping list item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to shopping list',
      error: error.message
    });
  }
};

export const updateItem = async (req: Request, res: Response) => {
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
    const item = await ShoppingListItem.findOne(query);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const { name, quantity, unit, checked, category, priority } = req.body;

    if (name !== undefined) item.name = name;
    if (quantity !== undefined) item.quantity = quantity;
    if (unit !== undefined) item.unit = unit;
    if (checked !== undefined) item.checked = checked;
    if (category !== undefined) item.category = category;
    if (priority !== undefined) item.priority = priority;

    await item.save();

    res.json({
      success: true,
      data: item,
      message: 'Item updated'
    });
  } catch (error: any) {
    console.error('Error updating shopping list item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message
    });
  }
};

export const toggleItem = async (req: Request, res: Response) => {
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
    const item = await ShoppingListItem.findOne(query);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    item.checked = !item.checked;
    await item.save();

    res.json({
      success: true,
      data: item,
      message: item.checked ? 'Item checked' : 'Item unchecked'
    });
  } catch (error: any) {
    console.error('Error toggling shopping list item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle item',
      error: error.message
    });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
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
    const item = await ShoppingListItem.findOneAndDelete(query);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item removed from shopping list'
    });
  } catch (error: any) {
    console.error('Error deleting shopping list item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item',
      error: error.message
    });
  }
};

export const clearChecked = async (req: Request, res: Response) => {
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

    const query = { ...buildHouseholdQuery(context), checked: true };
    const result = await ShoppingListItem.deleteMany(query);

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} checked items`
    });
  } catch (error: any) {
    console.error('Error clearing checked items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear checked items',
      error: error.message
    });
  }
};

export const generateFromLowStock = async (req: Request, res: Response) => {
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

    const pantryQuery = { ...buildHouseholdQuery(context), quantity: { $lte: 2 } };
    const lowStockItems = await PantryItem.find(pantryQuery);

    if (lowStockItems.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No low stock items found'
      });
    }

    const shoppingQuery = { ...buildHouseholdQuery(context), pantryItemId: { $in: lowStockItems.map(i => i._id) } };
    const existingShoppingItems = await ShoppingListItem.find(shoppingQuery);

    const existingPantryIds = new Set(
      existingShoppingItems.map(i => i.pantryItemId?.toString())
    );

    const newItems = [];
    for (const pantryItem of lowStockItems) {
      const pantryId = (pantryItem._id as string).toString();
      if (!existingPantryIds.has(pantryId)) {
        const shoppingItem = new ShoppingListItem({
          ...buildItemAttribution(context),
          name: pantryItem.name,
          quantity: 1,
          unit: pantryItem.unit,
          category: pantryItem.category,
          pantryItemId: pantryItem._id,
          priority: 'normal'
        });
        await shoppingItem.save();
        newItems.push(shoppingItem);
      }
    }

    res.json({
      success: true,
      data: newItems,
      message: `Added ${newItems.length} items from low stock`
    });
  } catch (error: any) {
    console.error('Error generating from low stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate from low stock',
      error: error.message
    });
  }
};

export const addToPantry = async (req: Request, res: Response) => {
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
    const shoppingItem = await ShoppingListItem.findOne(query);

    if (!shoppingItem) {
      return res.status(404).json({
        success: false,
        message: 'Shopping list item not found'
      });
    }

    if (shoppingItem.pantryItemId) {
      const pantryItem = await PantryItem.findById(shoppingItem.pantryItemId);
      if (pantryItem) {
        pantryItem.quantity += shoppingItem.quantity;
        await pantryItem.save();

        await ShoppingListItem.deleteOne({ _id: id });

        return res.json({
          success: true,
          data: pantryItem,
          message: `Added ${shoppingItem.quantity} to existing pantry item`
        });
      }
    }

    const newPantryItem = new PantryItem({
      ...buildItemAttribution(context),
      name: shoppingItem.name,
      quantity: shoppingItem.quantity,
      unit: shoppingItem.unit,
      category: shoppingItem.category
    });

    await newPantryItem.save();
    await ShoppingListItem.deleteOne({ _id: id });

    res.json({
      success: true,
      data: newPantryItem,
      message: 'Item added to pantry'
    });
  } catch (error: any) {
    console.error('Error adding to pantry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to pantry',
      error: error.message
    });
  }
};
