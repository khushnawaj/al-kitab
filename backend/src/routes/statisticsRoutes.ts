import { Router } from 'express';
import { statisticsController } from '../controllers/StatisticsController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Statistics route is protected
router.get('/', authenticate, statisticsController.getStatistics);

export default router;
