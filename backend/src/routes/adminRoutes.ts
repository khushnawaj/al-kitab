import { Router } from 'express';
import { adminController } from '../controllers/AdminController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = Router();

// Protect all admin endpoints with authentication and role check
router.use(authenticate);
router.use(isAdmin);

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

export default router;
