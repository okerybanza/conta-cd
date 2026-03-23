import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Routes dashboard
router.get('/stats', dashboardController.getStats.bind(dashboardController) as any);
router.get('/quota-summary', dashboardController.getQuotaSummary.bind(dashboardController) as any);

export default router;

