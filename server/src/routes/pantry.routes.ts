import express from 'express';
import { getAllItems, createItem, updateItem, deleteItem } from '../controllers/pantry.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

console.log('Pantry routes file loaded, setting up routes...');
console.log('getAllItems:', typeof getAllItems);
console.log('authenticate:', typeof authenticate);
router.get('/', authenticate, getAllItems);
console.log('GET / registered');
router.post('/', authenticate, createItem);
console.log('POST / registered');
router.put('/:id', authenticate, updateItem);
console.log('PUT /:id registered');
router.delete('/:id', authenticate, deleteItem);
console.log('DELETE /:id registered');

export default router;
