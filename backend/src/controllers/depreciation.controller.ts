import { Response } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import depreciationService from '../services/depreciation.service';
import logger from '../utils/logger';
import { z } from 'zod';

const createDepreciationSchema = z.object({
  assetAccountId: z.string().uuid(),
  depreciationAccountId: z.string().uuid(),
  assetName: z.string().min(1).max(255),
  acquisitionDate: z.string().or(z.date()),
  acquisitionCost: z.number().positive(),
  depreciationMethod: z.enum(['linear', 'declining']),
  depreciationRate: z.number().min(0).max(100).optional(),
  usefulLife: z.number().int().positive(),
  notes: z.string().optional(),
});

const updateDepreciationSchema = z.object({
  assetName: z.string().min(1).max(255).optional(),
  depreciationMethod: z.enum(['linear', 'declining']).optional(),
  depreciationRate: z.number().min(0).max(100).optional(),
  usefulLife: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

/**
 * Créer un plan d'amortissement
 */
export const createDepreciation = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const userId = req.user!.id;

    const data = createDepreciationSchema.parse(req.body);

    const depreciation = await depreciationService.create(companyId, data, userId);

    logger.info(`Depreciation created: ${depreciation.id}`, { companyId, userId });

    res.status(201).json({
      success: true,
      data: depreciation,
    });
  } catch (error: any) {
    logger.error('Error creating depreciation', { error: error.message, stack: error.stack });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid data',
        errors: error.errors,
      });
    }

    res.status(error.statusCode || 500).json({
      message: error.message || 'Error creating depreciation',
      code: error.code,
    });
  }
};

/**
 * Obtenir un plan d'amortissement par ID
 */
export const getDepreciation = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    const depreciation = await depreciationService.getById(companyId, id);

    res.json({
      success: true,
      data: depreciation,
    });
  } catch (error: any) {
    logger.error('Error getting depreciation', { error: error.message });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error getting depreciation',
      code: error.code,
    });
  }
};

/**
 * Lister les plans d'amortissement
 */
export const listDepreciations = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const isActive = req.query.isActive 
      ? req.query.isActive === 'true' 
      : undefined;

    const depreciations = await depreciationService.list(companyId, { isActive });

    res.json({
      success: true,
      data: depreciations,
    });
  } catch (error: any) {
    logger.error('Error listing depreciations', { error: error.message });
    res.status(500).json({
      message: error.message || 'Error listing depreciations',
    });
  }
};

/**
 * Mettre à jour un plan d'amortissement
 */
export const updateDepreciation = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    const data = updateDepreciationSchema.parse(req.body);

    const depreciation = await depreciationService.update(companyId, id, data);

    logger.info(`Depreciation updated: ${id}`, { companyId });

    res.json({
      success: true,
      data: depreciation,
    });
  } catch (error: any) {
    logger.error('Error updating depreciation', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid data',
        errors: error.errors,
      });
    }

    res.status(error.statusCode || 500).json({
      message: error.message || 'Error updating depreciation',
      code: error.code,
    });
  }
};

/**
 * Calculer l'amortissement mensuel
 */
export const calculateMonthlyDepreciation = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    const monthlyDepreciation = await depreciationService.calculateMonthlyDepreciation(
      companyId,
      id
    );

    res.json({
      success: true,
      data: { monthlyDepreciation },
    });
  } catch (error: any) {
    logger.error('Error calculating monthly depreciation', { error: error.message });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error calculating monthly depreciation',
      code: error.code,
    });
  }
};

/**
 * Générer une écriture d'amortissement
 */
export const generateDepreciationEntry = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const userId = req.user!.id;
    const { id } = req.params;
    const { period } = req.body;

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        message: 'Invalid period format. Expected format: YYYY-MM (e.g., 2025-01)',
      });
    }

    const entry = await depreciationService.generateDepreciationEntry(
      companyId,
      id,
      period,
      userId
    );

    logger.info(`Depreciation entry generated: ${entry.id}`, {
      companyId,
      depreciationId: id,
      period,
    });

    res.json({
      success: true,
      data: entry,
    });
  } catch (error: any) {
    logger.error('Error generating depreciation entry', { error: error.message, stack: error.stack });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error generating depreciation entry',
      code: error.code,
    });
  }
};

/**
 * Générer le tableau d'amortissement
 */
export const generateDepreciationTable = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    const table = await depreciationService.generateDepreciationTable(companyId, id);

    res.json({
      success: true,
      data: table,
    });
  } catch (error: any) {
    logger.error('Error generating depreciation table', { error: error.message });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error generating depreciation table',
      code: error.code,
    });
  }
};

/**
 * Supprimer un plan d'amortissement
 */
export const deleteDepreciation = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    await depreciationService.delete(companyId, id);

    logger.info(`Depreciation deleted: ${id}`, { companyId });

    res.json({
      success: true,
      message: 'Depreciation deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting depreciation', { error: error.message });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error deleting depreciation',
      code: error.code,
    });
  }
};

