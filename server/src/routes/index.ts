import express from 'express';
import authRoutes from './auth.routes';
import aiRoutes from './ai.routes';
import dashboardRoutes from './dashboard.routes';
import pantryRoutes from './pantry.routes';
import shoppingListRoutes from './shopping-list.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/generate', aiRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/pantry', pantryRoutes);
router.use('/shopping-list', shoppingListRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;