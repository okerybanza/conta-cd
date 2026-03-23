import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import auditService from '../services/audit.service';

export class AuditController {
  // Obtenir les logs d'audit
  async getLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        userId: req.query.userId as string | undefined,
        action: req.query.action as string | undefined,
        entityType: req.query.entityType as string | undefined,
        entityId: req.query.entityId as string | undefined,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };

      const companyId = getCompanyId(req);
      const result = await auditService.getLogs(companyId, filters);

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtenir un log spécifique
  async getLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;

      const companyId = getCompanyId(req);
      const log = await auditService.getLogs(companyId, {
        entityId: id,
        limit: 1,
      });

      if (log.logs.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Log not found',
        });
      }

      res.json({
        success: true,
        data: log.logs[0],
      });
    } catch (error) {
      next(error);
    }
  }

  // Vérifier l'intégrité de la chaîne de hashage
  async verifyIntegrity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      // Seul un super admin ou un rôle spécifique peut vérifier l'intégrité globale
      // Pour l'instant on laisse passer si authentifié, mais on pourrait ajouter une vérif de rôle
      const result = await auditService.verifyIntegrity();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuditController();

