import { Request, Response } from 'express';
import PantryItem, { CATEGORIES, STORAGE_LOCATIONS } from '../models/PantryItem';

export const getAllItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { category, storageLocation } = req.query;

    const filter: any = { userId };
    if (category) filter.category = category;
    if (storageLocation) filter.storageLocation = storageLocation;

    const items = await PantryItem.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    console.error('Error fetching pantry items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pantry items',
      error: error.message
    });
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      categories: CATEGORIES,
      storageLocations: STORAGE_LOCATIONS
    }
  });
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { name, quantity, unit, expirationDate, category, storageLocation, barcode, notes, macros } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required'
      });
    }

    const newItem = new PantryItem({
      userId,
      name,
      quantity: quantity || 1,
      unit,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      category,
      storageLocation: storageLocation || 'Pantry',
      barcode,
      notes,
      macros
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Item added successfully'
    });
  } catch (error: any) {
    console.error('Error creating pantry item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pantry item',
      error: error.message
    });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const item = await PantryItem.findOne({ _id: id, userId });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const { name, quantity, unit, expirationDate, category, storageLocation, barcode, notes, macros } = req.body;

    if (name !== undefined) item.name = name;
    if (quantity !== undefined) item.quantity = quantity;
    if (unit !== undefined) item.unit = unit;
    if (expirationDate !== undefined) item.expirationDate = expirationDate ? new Date(expirationDate) : undefined;
    if (category !== undefined) item.category = category;
    if (storageLocation !== undefined) item.storageLocation = storageLocation;
    if (barcode !== undefined) item.barcode = barcode;
    if (notes !== undefined) item.notes = notes;
    if (macros !== undefined) item.macros = macros;

    await item.save();

    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating pantry item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pantry item',
      error: error.message
    });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const item = await PantryItem.findOneAndDelete({ _id: id, userId });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting pantry item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pantry item',
      error: error.message
    });
  }
};
