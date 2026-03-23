import { Router } from 'express';
import contractController from '../controllers/contract.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Templates de contrats
router.get('/templates', contractController.getTemplates.bind(contractController) as any);

// CRUD des contrats
router.post('/', contractController.create.bind(contractController) as any);
router.get('/', contractController.list.bind(contractController) as any);
router.get('/:id', contractController.getById.bind(contractController) as any);
router.put('/:id', contractController.update.bind(contractController) as any);
router.delete('/:id', contractController.cancel.bind(contractController) as any);

// Signatures
router.post('/:id/sign/company', contractController.signByCompany.bind(contractController) as any);
router.post('/:id/sign/accountant', contractController.signByAccountant.bind(contractController) as any);

export default router;

