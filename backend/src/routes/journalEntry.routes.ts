import { Router } from 'express';
import journalEntryController from '../controllers/journalEntry.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Toutes les routes nécessitent la fonctionnalité "accounting"
router.use(requireFeature('accounting') as any);

router.post('/', idempotencyMiddleware as any, journalEntryController.create.bind(journalEntryController) as any);
router.get('/', journalEntryController.list.bind(journalEntryController) as any);
router.get('/:id', journalEntryController.getById.bind(journalEntryController) as any);
router.put('/:id', journalEntryController.update.bind(journalEntryController) as any);
router.post('/:id/post', journalEntryController.post.bind(journalEntryController) as any);
router.post('/:id/reverse', journalEntryController.reverse.bind(journalEntryController) as any); // SPRINT 1 - TASK 1.3
router.delete('/:id', journalEntryController.delete.bind(journalEntryController) as any);

export default router;

