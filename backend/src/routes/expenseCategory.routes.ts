import { Router } from 'express';
import expenseCategoryController from '../controllers/expenseCategory.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', expenseCategoryController.list.bind(expenseCategoryController) as any);
router.post('/', expenseCategoryController.create.bind(expenseCategoryController) as any);
router.get('/:id', expenseCategoryController.getById.bind(expenseCategoryController) as any);
router.put('/:id', expenseCategoryController.update.bind(expenseCategoryController) as any);
router.delete('/:id', expenseCategoryController.delete.bind(expenseCategoryController) as any);

export default router;
