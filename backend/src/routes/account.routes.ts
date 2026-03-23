import { Router } from 'express';
import accountController from '../controllers/account.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';
import { preventDirectBalanceUpdate } from '../middleware/prevent-direct-aggregate-updates.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Toutes les routes nécessitent la fonctionnalité "accounting"
router.use(requireFeature('accounting') as any);

router.post('/', accountController.create.bind(accountController) as any);
router.get('/', accountController.list.bind(accountController) as any);
router.get('/tree', accountController.getTree.bind(accountController) as any);
router.get('/by-type/:type', accountController.findByType.bind(accountController) as any);
router.get('/code/:code', accountController.getByCode.bind(accountController) as any);
router.get('/:id', accountController.getById.bind(accountController) as any);
router.get('/:id/balance', accountController.getTotalBalance.bind(accountController) as any);
// Protection contre les mises à jour directes des soldes (DOC-02)
router.put('/:id', preventDirectBalanceUpdate as any, accountController.update.bind(accountController) as any);
router.delete('/:id', accountController.delete.bind(accountController) as any);

export default router;

