import { Router } from 'express';
import { counterController } from '../controllers/CounterController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createCounterSchema, updateCounterSchema, addCounterLogSchema } from '../validators/schemas.js';

const router = Router();

// All counter routes are protected
router.use(authenticate);

router.get('/', counterController.getCounters);
router.get('/:id', counterController.getCounterById);
router.post('/', validate(createCounterSchema), counterController.createCounter);
router.put('/:id', validate(updateCounterSchema), counterController.updateCounter);
router.delete('/:id', counterController.deleteCounter);

router.post('/:id/logs', validate(addCounterLogSchema), counterController.addLog);
router.delete('/:id/logs/:logId', counterController.deleteLog);

export default router;
