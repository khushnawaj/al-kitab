import { Router } from 'express';
import { authController } from '../controllers/AuthController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema, verifyPasswordSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/verify-password', authenticate, validate(verifyPasswordSchema), authController.verifyPassword);
router.delete('/delete-account', authenticate, authController.deleteAccount);

export default router;
