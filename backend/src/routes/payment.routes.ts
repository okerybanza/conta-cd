
import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import maxicashController from '../controllers/maxicash.controller';
import { authenticate } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();

// Routes protégées par authentification
router.use(authenticate);

router.post('/', idempotencyMiddleware as any, (req, res, next) => paymentController.create(req as any, res, next));
router.get('/', (req, res, next) => paymentController.list(req as any, res, next));
router.get('/:id', (req, res, next) => paymentController.getById(req as any, res, next));
router.get('/invoice/:invoiceId', (req, res, next) => paymentController.getByInvoice(req as any, res, next));
router.put('/:id', (req, res, next) => paymentController.update(req as any, res, next));
router.delete('/:id', (req, res, next) => paymentController.delete(req as any, res, next));

// MaxiCash - Paiement mobile RDC
router.post(
  '/maxicash/init',
  (req, res, next) => maxicashController.initPayment(req as any, res, next)
);

router.get(
  '/maxicash/status/:transactionReference',
  (req, res, next) => maxicashController.checkStatus(req as any, res, next)
);

export default router;
