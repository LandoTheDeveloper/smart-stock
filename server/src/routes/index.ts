import express from 'express';
import authRoutes from './auth.routes';
import aiRoutes from './ai.routes';
import dashboardRoutes from './dashboard.routes';
import pantryRoutes from './pantry.routes';

console.log('Dashboard routes stack:', dashboardRoutes.stack?.length);
console.log('Pantry routes stack:', pantryRoutes.stack?.length);

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/generate', aiRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/pantry', pantryRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;