import { Response } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import fiscalPeriodService from '../services/fiscalPeriod.service';
import logger from '../utils/logger';
import { z } from 'zod';

const createFiscalPeriodSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    notes: z.string().optional(),
  }),
});

const updateFiscalPeriodSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    notes: z.string().optional(),
  }),
});

/**
 * Créer un exercice comptable
 */
export const createFiscalPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const userId = req.user!.id;

    const validated = createFiscalPeriodSchema.parse(req);
    const period = await fiscalPeriodService.create(companyId, validated.body, userId);

    logger.info(`Fiscal period created via API`, { companyId, periodId: period.id });

    res.status(201).json({
      success: true,
      data: period,
    });
  } catch (error: any) {
    logger.error('Error creating fiscal period', { error: error.message, stack: error.stack });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid data',
        errors: error.errors,
      });
    }

    res.status(error.statusCode || 500).json({
      message: error.message || 'Error creating fiscal period',
      code: error.code,
    });
  }
};

/**
 * Obtenir un exercice par ID
 */
export const getFiscalPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const periodId = req.params.id;

    const period = await fiscalPeriodService.getById(companyId, periodId);

    res.json({
      success: true,
      data: period,
    });
  } catch (error: any) {
    logger.error('Error getting fiscal period', { error: error.message, stack: error.stack });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error getting fiscal period',
      code: error.code,
    });
  }
};

/**
 * Lister les exercices
 */
export const listFiscalPeriods = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const filters: any = {};

    if (req.query.isClosed !== undefined) {
      filters.isClosed = req.query.isClosed === 'true';
    }

    if (req.query.isLocked !== undefined) {
      filters.isLocked = req.query.isLocked === 'true';
    }

    if (req.query.year) {
      filters.year = parseInt(req.query.year as string);
    }

    const periods = await fiscalPeriodService.list(companyId, filters);

    res.json({
      success: true,
      data: periods,
    });
  } catch (error: any) {
    logger.error('Error listing fiscal periods', { error: error.message, stack: error.stack });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error listing fiscal periods',
      code: error.code,
    });
  }
};

/**
 * Obtenir l'exercice en cours
 */
export const getCurrentFiscalPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    const period = await fiscalPeriodService.getCurrent(companyId);

    res.json({
      success: true,
      data: period,
    });
  } catch (error: any) {
    logger.error('Error getting current fiscal period', { error: error.message, stack: error.stack });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error getting current fiscal period',
      code: error.code,
    });
  }
};

/**
 * Clôturer un exercice
 */
export const closeFiscalPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const userId = req.user!.id;
    const periodId = req.params.id;

    const period = await fiscalPeriodService.close(companyId, periodId, userId);

    logger.info(`Fiscal period closed via API`, { companyId, periodId, userId });

    res.json({
      success: true,
      data: period,
    });
  } catch (error: any) {
    logger.error('Error closing fiscal period', { error: error.message, stack: error.stack });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error closing fiscal period',
      code: error.code,
    });
  }
};

/**
 * Rouvrir un exercice
 */
export const reopenFiscalPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const userId = req.user!.id;
    const periodId = req.params.id;

    const period = await fiscalPeriodService.reopen(companyId, periodId, userId);

    logger.info(`Fiscal period reopened via API`, { companyId, periodId, userId });

    res.json({
      success: true,
      data: period,
    });
  } catch (error: any) {
    logger.error('Error reopening fiscal period', { error: error.message, stack: error.stack });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error reopening fiscal period',
      code: error.code,
    });
  }
};

/**
 * Verrouiller une période
 */
export const lockFiscalPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const userId = req.user!.id;
    const periodId = req.params.id;

    const period = await fiscalPeriodService.lock(companyId, periodId, userId);

    logger.info(`Fiscal period locked via API`, { companyId, periodId, userId });

    res.json({
      success: true,
      data: period,
    });
  } catch (error: any) {
    logger.error('Error locking fiscal period', { error: error.message, stack: error.stack });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error locking fiscal period',
      code: error.code,
    });
  }
};

/**
 * Déverrouiller une période
 */
export const unlockFiscalPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const userId = req.user!.id;
    const periodId = req.params.id;

    const period = await fiscalPeriodService.unlock(companyId, periodId, userId);

    logger.info(`Fiscal period unlocked via API`, { companyId, periodId, userId });

    res.json({
      success: true,
      data: period,
    });
  } catch (error: any) {
    logger.error('Error unlocking fiscal period', { error: error.message, stack: error.stack });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error unlocking fiscal period',
      code: error.code,
    });
  }
};

/**
 * Mettre à jour un exercice
 */
export const updateFiscalPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const periodId = req.params.id;

    const validated = updateFiscalPeriodSchema.parse(req);
    const period = await fiscalPeriodService.update(companyId, periodId, validated.body);

    logger.info(`Fiscal period updated via API`, { companyId, periodId });

    res.json({
      success: true,
      data: period,
    });
  } catch (error: any) {
    logger.error('Error updating fiscal period', { error: error.message, stack: error.stack });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid data',
        errors: error.errors,
      });
    }

    res.status(error.statusCode || 500).json({
      message: error.message || 'Error updating fiscal period',
      code: error.code,
    });
  }
};

/**
 * Supprimer un exercice
 */
export const deleteFiscalPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const periodId = req.params.id;

    const result = await fiscalPeriodService.delete(companyId, periodId);

    logger.info(`Fiscal period deleted via API`, { companyId, periodId });

    res.json(result);
  } catch (error: any) {
    logger.error('Error deleting fiscal period', { error: error.message, stack: error.stack });
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error deleting fiscal period',
      code: error.code,
    });
  }
};

