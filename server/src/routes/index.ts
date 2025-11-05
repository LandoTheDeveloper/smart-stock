import express from 'express';
import authRoutes from './auth.routes';
import aiRoutes from './ai.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/generate', aiRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;