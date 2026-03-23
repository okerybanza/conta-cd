
import { Router } from 'express';
import invoiceController from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();

// Routes protégées par authentification
router.use(authenticate);

router.post('/', idempotencyMiddleware as any, (req, res, next) => invoiceController.create(req as any, res, next));
router.get('/', (req, res, next) => invoiceController.list(req as any, res, next));
router.get('/:id', (req, res, next) => invoiceController.getById(req as any, res, next));
router.put('/:id', (req, res, next) => invoiceController.update(req as any, res, next));
router.delete('/:id', (req, res, next) => invoiceController.delete(req as any, res, next));
router.patch('/:id/status', (req, res, next) => invoiceController.updateStatus(req as any, res, next));
router.post('/:id/duplicate', (req, res, next) => invoiceController.duplicate(req as any, res, next));
router.get('/:id/pdf', (req, res, next) => invoiceController.generatePDF(req as any, res, next));
router.get('/:id/preview', (req, res, next) => invoiceController.previewHTML(req as any, res, next));

export default router;
