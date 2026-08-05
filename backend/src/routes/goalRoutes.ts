import { Router } from 'express';
import { goalController } from '../controllers/GoalController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { goalSchema } from '../validators/schemas.js';

const router = Router();

// All goal routes are protected
router.use(authenticate);

router.get('/', goalController.getGoals);
router.put('/', validate(goalSchema), goalController.updateGoals);

export default router;
