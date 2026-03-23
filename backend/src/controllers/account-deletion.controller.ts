import { Request, Response, NextFunction } from 'express';
import accountDeletionService from '../services/account-deletion.service';
import { CustomError } from '../middleware/error.middleware';
import { authenticate, AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  reason: z.string().optional(),
  anonymizeImmediately: z.boolean().optional(),
});

const restoreAccountSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8).optional(),
});

export class AccountDeletionController {
  /**
   * DELETE /api/v1/account/delete
   * Supprimer son propre compte ou un compte utilisateur (admin)
   */
  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId || req.user.id; // Permettre de supprimer un autre utilisateur si admin
      const deleterId = req.user.id;

      // Si on essaie de supprimer un autre utilisateur, vérifier les permissions
      if (userId !== deleterId) {
        const companyId = getCompanyId(req);
        if (!companyId) {
          throw new CustomError('Company ID required', 400, 'COMPANY_ID_REQUIRED');
        }

        // Vérifier que l'utilisateur est admin de l'entreprise
        const userService = (await import('../services/user.service')).default;
        const user = await userService.getUserById(companyId, deleterId);
        if (user.role !== 'admin') {
          throw new CustomError(
            'Seuls les administrateurs peuvent supprimer d\'autres comptes',
            403,
            'INSUFFICIENT_PERMISSIONS'
          );
        }
      }

      const validated = deleteAccountSchema.parse(req.body);

      const result = await accountDeletionService.deleteAccount(userId, deleterId, {
        reason: validated.reason,
        anonymizeImmediately: validated.anonymizeImmediately || false,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/account/restore
   * Restaurer un compte supprimé (pendant la période de grâce)
   */
  async restoreAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = restoreAccountSchema.parse(req.body);

      const result = await accountDeletionService.restoreAccount(
        validated.email,
        validated.newPassword
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/account/deleted-info
   * Obtenir les informations sur un compte supprimé
   */
  async getDeletedAccountInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.query.email as string;

      if (!email) {
        throw new CustomError('Email parameter is required', 400, 'EMAIL_REQUIRED');
      }

      const info = await accountDeletionService.getDeletedAccountInfo(email);

      res.json({
        success: true,
        data: info,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/account/check-email
   * Vérifier si un email peut être réutilisé (pour l'inscription)
   */
  async checkEmailReusability(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.body.email;

      if (!email || typeof email !== 'string') {
        throw new CustomError('Email is required', 400, 'EMAIL_REQUIRED');
      }

      const result = await accountDeletionService.canReuseEmail(email);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AccountDeletionController();
