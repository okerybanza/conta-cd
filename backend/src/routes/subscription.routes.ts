import { Router } from 'express';
import subscriptionController from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

router.get('/', subscriptionController.getActive.bind(subscriptionController) as any);
router.get('/quota-summary', subscriptionController.getQuotaSummary.bind(subscriptionController) as any);
router.post('/', subscriptionController.create.bind(subscriptionController) as any);
router.put('/upgrade', subscriptionController.upgrade.bind(subscriptionController) as any);
router.post('/cancel', subscriptionController.cancel.bind(subscriptionController) as any);
router.post('/renew', subscriptionController.renew.bind(subscriptionController) as any);

export default router;

