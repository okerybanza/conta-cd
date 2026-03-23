import { Response } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import agedBalanceService from '../services/agedBalance.service';
import logger from '../utils/logger';
import { z } from 'zod';

const agedBalanceQuerySchema = z.object({
  type: z.enum(['receivables', 'payables']),
  asOfDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
});

/**
 * Générer la Balance Âgée
 */
export const generateAgedBalance = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider les paramètres
    const params = agedBalanceQuerySchema.parse(req.query);

    const report = await agedBalanceService.generateAgedBalance(
      companyId,
      params.type,
      params.asOfDate
    );

    logger.info(`Aged balance generated for company ${companyId}`, {
      companyId,
      type: params.type,
      totalItems: report.items.length,
      totalAmount: report.totals.total,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    logger.error('Error generating aged balance', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error generating aged balance',
    });
  }
};

