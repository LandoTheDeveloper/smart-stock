import express from 'express';
import authRoutes from './auth.routes';
import aiRoutes from './ai.routes';
import dashboardRoutes from './dashboard.routes';
import pantryRoutes from './pantry.routes';

const router = express.Router();

console.log('Setting up routes...');
router.use('/auth', authRoutes);
console.log('Auth routes registered');
router.use('/generate', aiRoutes);
console.log('AI routes registered');
router.use('/dashboard', dashboardRoutes);
console.log('Dashboard routes registered');
router.use('/pantry', pantryRoutes);
console.log('Pantry routes registered');

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;