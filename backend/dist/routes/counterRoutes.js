import { Router } from 'express';
import { counterController } from '../controllers/CounterController.js';
import { authenticate } from '../middlewares/auth.js';
const router = Router();
// All counter routes are protected
router.use(authenticate);
router.get('/', counterController.getCounters);
router.get('/:id', counterController.getCounterById);
router.post('/', counterController.createCounter);
router.put('/:id', counterController.updateCounter);
router.delete('/:id', counterController.deleteCounter);
router.post('/:id/logs', counterController.addLog);
router.delete('/:id/logs/:logId', counterController.deleteLog);
export default router;
