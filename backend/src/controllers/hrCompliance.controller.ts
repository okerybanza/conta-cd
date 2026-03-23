import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import hrComplianceService from '../services/hrCompliance.service';

const complianceQuerySchema = z.object({
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

export class HrComplianceController {
  async getRdcReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');

      const { periodStart, periodEnd } = complianceQuerySchema.parse(req.query);

      // Par défaut : 3 derniers mois
      const end = periodEnd ? new Date(periodEnd) : new Date();
      const start = periodStart
        ? new Date(periodStart)
        : new Date(end.getFullYear(), end.getMonth() - 2, 1);

      const report = await hrComplianceService.generateComplianceReport(
        getCompanyId(req),
        start,
        end
      );

      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}

export default new HrComplianceController();


