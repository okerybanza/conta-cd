import { Router } from 'express';
import paypalController from '../controllers/paypal.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Créer une Order PayPal
router.post('/init', paypalController.createOrder.bind(paypalController) as any);

// Capturer une Order PayPal
router.post('/capture', paypalController.captureOrder.bind(paypalController) as any);

// Récupérer les détails d'une Order
router.get('/order/:orderId', paypalController.getOrderDetails.bind(paypalController) as any);

export default router;

