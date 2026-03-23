import { Response } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import tvaService from '../services/tva.service';
import logger from '../utils/logger';
import { z } from 'zod';

const vatReportFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['month', 'quarter', 'year']).optional(),
});

/**
 * Obtenir le rapport TVA
 */
export const getVATReport = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider les filtres
    const filters = vatReportFiltersSchema.parse(req.query);

    // Convertir les dates string en Date si présentes
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const report = await tvaService.generateVATReport(companyId, processedFilters);

    logger.info(`VAT report generated for company ${companyId}`, {
      companyId,
      period: report.period,
      vatToPay: report.summary.vatToPay,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    logger.error('Error generating VAT report', { error: error.message, stack: error.stack });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid filters',
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: error.message || 'Error generating VAT report',
    });
  }
};

/**
 * Calculer la TVA collectée
 */
export const getVATCollected = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const filters = vatReportFiltersSchema.parse(req.query);

    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const amount = await tvaService.calculateVATCollected(companyId, processedFilters);

    res.json({
      success: true,
      data: { amount },
    });
  } catch (error: any) {
    logger.error('Error calculating VAT collected', { error: error.message });
    res.status(500).json({
      message: error.message || 'Error calculating VAT collected',
    });
  }
};

/**
 * Calculer la TVA déductible
 */
export const getVATDeductible = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const filters = vatReportFiltersSchema.parse(req.query);

    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const amount = await tvaService.calculateVATDeductible(companyId, processedFilters);

    res.json({
      success: true,
      data: { amount },
    });
  } catch (error: any) {
    logger.error('Error calculating VAT deductible', { error: error.message });
    res.status(500).json({
      message: error.message || 'Error calculating VAT deductible',
    });
  }
};

/**
 * Calculer la TVA à payer
 */
export const getVATToPay = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const filters = vatReportFiltersSchema.parse(req.query);

    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const amount = await tvaService.calculateVATToPay(companyId, processedFilters);

    res.json({
      success: true,
      data: { amount },
    });
  } catch (error: any) {
    logger.error('Error calculating VAT to pay', { error: error.message });
    res.status(500).json({
      message: error.message || 'Error calculating VAT to pay',
    });
  }
};

/**
 * Générer une déclaration TVA
 */
export const generateVATDeclaration = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const period = req.query.period as string;

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        message: 'Invalid period format. Expected format: YYYY-MM (e.g., 2025-01)',
      });
    }

    const declaration = await tvaService.generateVATDeclaration(companyId, period);

    logger.info(`VAT declaration generated for company ${companyId}`, {
      companyId,
      period,
      vatToPay: declaration.vatToPay,
    });

    res.json({
      success: true,
      data: declaration,
    });
  } catch (error: any) {
    logger.error('Error generating VAT declaration', { error: error.message, stack: error.stack });
    res.status(500).json({
      message: error.message || 'Error generating VAT declaration',
    });
  }
};

