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
router.post('/generate-from-low-stock', authenticate, generateFromLowStock); // Mobile app alias
router.put('/:id', authenticate, updateItem);
router.put('/:id/toggle', authenticate, toggleItem);
router.patch('/:id/toggle', authenticate, toggleItem); // Mobile app uses PATCH
router.delete('/checked', authenticate, clearChecked);
router.delete('/clear-checked', authenticate, clearChecked); // Mobile app alias
router.delete('/:id', authenticate, deleteItem);
router.post('/:id/to-pantry', authenticate, addToPantry);
router.post('/:id/add-to-pantry', authenticate, addToPantry); // Mobile app alias

export default router;
