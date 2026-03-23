import { Response } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import reconciliationService from '../services/reconciliation.service';
import logger from '../utils/logger';
import { z } from 'zod';

const reconciliationPeriodSchema = z.object({
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
});

/**
 * Réconcilier les factures avec leurs paiements
 */
export const reconcileInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider la période
    const period = reconciliationPeriodSchema.parse(req.query);

    const results = await reconciliationService.reconcileInvoicesPayments(
      companyId,
      period as any
    );

    logger.info(`Invoice reconciliation requested for company ${companyId}`, {
      companyId,
      period,
      totalInvoices: results.length,
    });

    res.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        reconciled: results.filter((r) => r.isReconciled).length,
        unreconciled: results.filter((r) => !r.isReconciled).length,
      },
    });
  } catch (error: any) {
    logger.error('Error reconciling invoices', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameters',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error reconciling invoices',
    });
  }
};

/**
 * Réconcilier les transactions avec leurs écritures comptables
 */
export const reconcileJournalEntries = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider la période
    const period = reconciliationPeriodSchema.parse(req.query);

    const results = await reconciliationService.reconcileJournalEntries(
      companyId,
      period as any
    );

    logger.info(`Journal entry reconciliation requested for company ${companyId}`, {
      companyId,
      period,
      totalTransactions: results.length,
    });

    res.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        reconciled: results.filter((r) => r.isReconciled).length,
        unreconciled: results.filter((r) => !r.isReconciled).length,
        missingEntries: results.filter((r) => !r.journalEntryId).length,
      },
    });
  } catch (error: any) {
    logger.error('Error reconciling journal entries', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameters',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error reconciling journal entries',
    });
  }
};

/**
 * Générer un rapport de réconciliation complet
 */
export const generateReconciliationReport = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider la période
    const period = reconciliationPeriodSchema.parse(req.query);

    const report = await reconciliationService.generateReconciliationReport(
      companyId,
      period as any
    );

    logger.info(`Reconciliation report generated for company ${companyId}`, {
      companyId,
      period,
      hasIssues: report.summary.hasIssues,
      totalIssues: report.summary.totalIssues,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    logger.error('Error generating reconciliation report', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameters',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error generating reconciliation report',
    });
  }
};

