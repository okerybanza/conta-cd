import { Response } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import balanceValidationService from '../services/balanceValidation.service';
import logger from '../utils/logger';

/**
 * Valider le solde d'un compte spécifique
 */
export const validateAccountBalance = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { accountId } = req.params;
    const autoCorrect = req.query.autoCorrect === 'true';

    const result = await balanceValidationService.validateAccountBalance(
      companyId,
      accountId,
      autoCorrect
    );

    logger.info(`Account balance validated: ${accountId}`, {
      companyId,
      accountId,
      isSynchronized: result.isSynchronized,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error validating account balance', {
      error: error.message,
      stack: error.stack,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error validating account balance',
    });
  }
};

/**
 * Valider tous les soldes d'une entreprise
 */
export const validateAllBalances = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const autoCorrect = req.query.autoCorrect === 'true';

    const report = await balanceValidationService.validateAllBalances(companyId, autoCorrect);

    logger.info(`All balances validated for company ${companyId}`, {
      companyId,
      synchronized: report.synchronized,
      desynchronized: report.desynchronized,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    logger.error('Error validating all balances', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Error validating all balances',
    });
  }
};

/**
 * Recalculer le solde d'un compte spécifique
 */
export const recalculateAccountBalance = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { accountId } = req.params;

    const result = await balanceValidationService.recalculateAccountBalance(companyId, accountId);

    logger.info(`Account balance recalculated: ${accountId}`, {
      companyId,
      accountId,
      difference: result.difference,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error recalculating account balance', {
      error: error.message,
      stack: error.stack,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error recalculating account balance',
    });
  }
};

/**
 * Recalculer tous les soldes d'une entreprise
 */
export const recalculateAllBalances = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    const result = await balanceValidationService.recalculateAllBalances(companyId);

    logger.info(`All balances recalculated for company ${companyId}`, {
      companyId,
      recalculated: result.recalculated,
      totalAdjustment: result.totalAdjustment,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error recalculating all balances', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Error recalculating all balances',
    });
  }
};

