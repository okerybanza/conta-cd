import { Request, Response } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import financialStatementsService from '../services/financialStatements.service';
import logger from '../utils/logger';
import { z } from 'zod';

const financialStatementFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['month', 'quarter', 'year']).optional(),
  compareWithPrevious: z.boolean().optional(),
});

/**
 * Obtenir le Compte de Résultat
 */
export const getIncomeStatement = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider les filtres
    const filters = financialStatementFiltersSchema.parse(req.query);

    // Convertir les dates string en Date si présentes
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const incomeStatement = await financialStatementsService.generateIncomeStatement(
      companyId,
      processedFilters
    );

    logger.info(`Income statement generated for company ${companyId}`, {
      companyId,
      period: incomeStatement.period,
    });

    res.json(incomeStatement);
  } catch (error: any) {
    logger.error('Error generating income statement', { error: error.message, stack: error.stack });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid filters',
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: error.message || 'Error generating income statement',
    });
  }
};

/**
 * Obtenir le Bilan
 */
export const getBalanceSheet = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider les filtres
    const filters = financialStatementFiltersSchema.parse(req.query);

    // Convertir les dates string en Date si présentes
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const balanceSheet = await financialStatementsService.generateBalanceSheet(
      companyId,
      processedFilters
    );

    logger.info(`Balance sheet generated for company ${companyId}`, {
      companyId,
      asOfDate: balanceSheet.period.asOfDate,
      isBalanced: balanceSheet.equation.isBalanced,
    });

    res.json(balanceSheet);
  } catch (error: any) {
    logger.error('Error generating balance sheet', { error: error.message, stack: error.stack });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid filters',
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: error.message || 'Error generating balance sheet',
    });
  }
};

/**
 * Obtenir le Tableau de Flux de Trésorerie
 */
export const getCashFlowStatement = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider les filtres
    const filters = financialStatementFiltersSchema.parse(req.query);

    // Convertir les dates string en Date si présentes
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const cashFlowStatement = await financialStatementsService.generateCashFlowStatement(
      companyId,
      processedFilters
    );

    logger.info(`Cash flow statement generated for company ${companyId}`, {
      companyId,
      period: cashFlowStatement.period,
    });

    res.json(cashFlowStatement);
  } catch (error: any) {
    logger.error('Error generating cash flow statement', { error: error.message, stack: error.stack });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid filters',
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: error.message || 'Error generating cash flow statement',
    });
  }
};

/**
 * Valider l'équation comptable
 */
export const validateAccountingEquation = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const asOfDate = req.query.asOfDate 
      ? new Date(req.query.asOfDate as string)
      : new Date();

    const validation = await financialStatementsService.validateAccountingEquation(
      companyId,
      asOfDate
    );

    logger.info(`Accounting equation validated for company ${companyId}`, {
      companyId,
      isValid: validation.isValid,
    });

    res.json(validation);
  } catch (error: any) {
    logger.error('Error validating accounting equation', { error: error.message, stack: error.stack });
    res.status(500).json({
      message: error.message || 'Error validating accounting equation',
    });
  }
};

