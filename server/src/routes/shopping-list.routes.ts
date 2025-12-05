import express from 'express';
import {
  getAllItems,
  createItem,
  updateItem,
  toggleItem,
  deleteItem,
  clearChecked,
  generateFromLowStock,
  addToPantry
} from '../controllers/shopping-list.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, getAllItems);
router.post('/', authenticate, createItem);
router.post('/generate', authenticate, generateFromLowStock);
router.put('/:id', authenticate, updateItem);
router.put('/:id/toggle', authenticate, toggleItem);
router.delete('/checked', authenticate, clearChecked);
router.delete('/:id', authenticate, deleteItem);
router.post('/:id/to-pantry', authenticate, addToPantry);

export default router;
