import { Router } from 'express';
import warehouseController from '../controllers/warehouse.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Toutes les routes nécessitent la fonctionnalité "stock" (PREMIUM)
router.use(requireFeature('stock') as any);

router.post('/', warehouseController.create.bind(warehouseController) as any);
router.get('/', warehouseController.list.bind(warehouseController) as any);
router.get('/default', warehouseController.getDefault.bind(warehouseController) as any);
router.get('/:id', warehouseController.getById.bind(warehouseController) as any);
router.put('/:id', warehouseController.update.bind(warehouseController) as any);
router.delete('/:id', warehouseController.delete.bind(warehouseController) as any);

export default router;
