import { Router } from 'express';
import quotationController from '../controllers/quotation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Routes CRUD
router.post('/', quotationController.create.bind(quotationController) as any);
router.get('/', quotationController.list.bind(quotationController) as any);
router.get('/:id', quotationController.getById.bind(quotationController) as any);
router.get('/:id/pdf', quotationController.generatePDF.bind(quotationController) as any);
router.put('/:id', quotationController.update.bind(quotationController) as any);
router.delete('/:id', quotationController.delete.bind(quotationController) as any);

// Route spéciale: convertir devis en facture
router.post('/:id/convert-to-invoice', quotationController.convertToInvoice.bind(quotationController) as any);

export default router;

