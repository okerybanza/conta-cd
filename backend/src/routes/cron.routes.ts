import { Router } from 'express';
import cronController from '../controllers/cron.controller';

const router = Router();

// Route pour le renouvellement automatique des abonnements
router.post('/renew-subscriptions', cronController.renewSubscriptions.bind(cronController) as any);

export default router;

