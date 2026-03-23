import { Router } from 'express';
import packageController from '../controllers/package.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Routes publiques pour voir les packages
router.get('/', packageController.list.bind(packageController) as any);
router.get('/:id', packageController.getById.bind(packageController) as any);
router.get('/code/:code', packageController.getByCode.bind(packageController) as any);

// Routes protégées pour la gestion des packages (admin uniquement)
router.post('/', authenticate as any, packageController.create.bind(packageController) as any);
router.put('/:id', authenticate as any, packageController.update.bind(packageController) as any);
router.delete('/:id', authenticate as any, packageController.delete.bind(packageController) as any);
router.get('/:id/subscriptions-count', authenticate as any, packageController.getSubscriptionsCount.bind(packageController) as any);

export default router;
