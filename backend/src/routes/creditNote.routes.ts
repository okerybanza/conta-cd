import { Router } from 'express';
import creditNoteController from '../controllers/creditNote.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes CRUD
router.get('/', creditNoteController.list.bind(creditNoteController) as any);
router.get('/:id', creditNoteController.getById.bind(creditNoteController) as any);
router.post('/', creditNoteController.create.bind(creditNoteController) as any);
router.put('/:id', creditNoteController.update.bind(creditNoteController) as any);
router.delete('/:id', creditNoteController.delete.bind(creditNoteController) as any);

// Route spéciale : appliquer un avoir
router.post('/:id/apply', creditNoteController.apply.bind(creditNoteController) as any);

export default router;

