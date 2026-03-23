import { Router } from 'express';
import accountDeletionController from '../controllers/account-deletion.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes de gestion de suppression/restauration de comptes
 */

// Route publique : restaurer un compte
router.post('/restore', accountDeletionController.restoreAccount);

// Route publique : vérifier si un email peut être réutilisé
router.post('/check-email', accountDeletionController.checkEmailReusability);

// Route publique : obtenir les infos d'un compte supprimé
router.get('/deleted-info', accountDeletionController.getDeletedAccountInfo);

// Route protégée : supprimer un compte (son propre compte ou un autre si admin)
router.delete('/delete/:userId?', authenticate, accountDeletionController.deleteAccount);

export default router;
