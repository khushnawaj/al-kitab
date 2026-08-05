import { Router } from 'express';
import { recitationController } from '../controllers/RecitationController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { recitationSchema, updateRecitationSchema } from '../validators/schemas.js';
const router = Router();
// All recitation routes are protected
router.use(authenticate);
router.get('/', recitationController.getRecitations);
router.post('/', validate(recitationSchema), recitationController.createRecitation);
// Export and Import routes
router.get('/export', recitationController.exportRecitations);
router.post('/import', recitationController.importRecitations);
router.get('/:id', recitationController.getRecitationById);
router.put('/:id', validate(updateRecitationSchema), recitationController.updateRecitation);
router.delete('/:id', recitationController.deleteRecitation);
export default router;
