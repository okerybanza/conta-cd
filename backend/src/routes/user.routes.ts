import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Seuls les admins peuvent gérer les utilisateurs
router.use(requireRole('admin') as any);

// Routes de gestion des utilisateurs
router.post('/invite', userController.invite.bind(userController) as any);
router.post('/', userController.create.bind(userController) as any);
router.get('/', userController.list.bind(userController) as any);
router.get('/:id', userController.getById.bind(userController) as any);
router.put('/:id', userController.update.bind(userController) as any);
router.delete('/:id', userController.delete.bind(userController) as any);
router.post('/:id/reset-password', userController.resetPassword.bind(userController) as any);

export default router;

