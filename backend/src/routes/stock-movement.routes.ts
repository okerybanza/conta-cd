import { Router } from 'express';
import stockMovementController from '../controllers/stock-movement.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Routes Stock Movements
router.post('/', stockMovementController.create.bind(stockMovementController) as any);
router.get('/', stockMovementController.list.bind(stockMovementController) as any);
router.get('/:id', stockMovementController.getById.bind(stockMovementController) as any);
router.post('/:id/validate', stockMovementController.validate.bind(stockMovementController) as any);
router.post('/:id/reverse', stockMovementController.reverse.bind(stockMovementController) as any);

// Route utilitaire pour calcul direct
router.get('/products/:productId/stock', stockMovementController.calculateStock.bind(stockMovementController) as any);

export default router;
