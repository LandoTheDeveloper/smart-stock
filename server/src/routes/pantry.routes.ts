import express from 'express';
import { getAllItems, getCategories, createItem, updateItem, deleteItem } from '../controllers/pantry.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, getAllItems);
router.get('/categories', getCategories);
router.post('/', authenticate, createItem);
router.put('/:id', authenticate, updateItem);
router.delete('/:id', authenticate, deleteItem);

export default router;
