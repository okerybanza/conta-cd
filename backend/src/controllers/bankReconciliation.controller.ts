import { Response } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import bankReconciliationService from '../services/bankReconciliation.service';
import logger from '../utils/logger';
import { z } from 'zod';

const importStatementSchema = z.object({
  accountId: z.string().uuid(),
  statementNumber: z.string(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  openingBalance: z.number(),
  closingBalance: z.number(),
  transactions: z.array(
    z.object({
      date: z.string().transform((str) => new Date(str)),
      valueDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
      description: z.string(),
      reference: z.string().optional(),
      amount: z.number(),
      balance: z.number().optional(),
    })
  ),
});

/**
 * Importer un relevé bancaire
 */
export const importBankStatement = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider les données
    const data = importStatementSchema.parse(req.body);

    const statement = await bankReconciliationService.importBankStatement(
      companyId,
      data.accountId,
      {
        accountId: data.accountId,
        statementNumber: data.statementNumber,
        startDate: data.startDate,
        endDate: data.endDate,
        openingBalance: data.openingBalance,
        closingBalance: data.closingBalance,
        transactions: data.transactions as any,
      }
    );

    logger.info(`Bank statement imported`, {
      companyId,
      statementId: statement.id,
    });

    res.json({
      success: true,
      data: statement,
    });
  } catch (error: any) {
    logger.error('Error importing bank statement', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error importing bank statement',
    });
  }
};

/**
 * Parser un fichier CSV
 */
export const parseCSV = async (req: AuthRequest, res: Response) => {
  try {
    const csvContent = req.body.csvContent || req.body.content;

    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'CSV content is required',
      });
    }

    const transactions = bankReconciliationService.parseCSV(csvContent);

    res.json({
      success: true,
      data: {
        transactions,
        count: transactions.length,
      },
    });
  } catch (error: any) {
    logger.error('Error parsing CSV', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Error parsing CSV',
    });
  }
};

/**
 * Rapprocher un relevé bancaire
 */
export const reconcileStatement = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { statementId } = req.params;

    // Vérifier que le relevé appartient à l'entreprise
    const statement = await bankReconciliationService.getBankStatement(
      statementId,
      companyId
    );

    if (!statement) {
      return res.status(404).json({
        success: false,
        message: 'Bank statement not found',
      });
    }

    await bankReconciliationService.reconcileStatement(statementId);

    const updatedStatement = await bankReconciliationService.getBankStatement(
      statementId,
      companyId
    );

    res.json({
      success: true,
      data: updatedStatement,
    });
  } catch (error: any) {
    logger.error('Error reconciling bank statement', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Error reconciling bank statement',
    });
  }
};

/**
 * Obtenir un relevé bancaire
 */
export const getBankStatement = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { statementId } = req.params;

    const statement = await bankReconciliationService.getBankStatement(
      statementId,
      companyId
    );

    if (!statement) {
      return res.status(404).json({
        success: false,
        message: 'Bank statement not found',
      });
    }

    res.json({
      success: true,
      data: statement,
    });
  } catch (error: any) {
    logger.error('Error getting bank statement', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Error getting bank statement',
    });
  }
};

/**
 * Lister les relevés bancaires
 */
export const listBankStatements = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const accountId = req.query.accountId as string | undefined;

    const statements = await bankReconciliationService.listBankStatements(
      companyId,
      accountId
    );

    res.json({
      success: true,
      data: statements,
    });
  } catch (error: any) {
    logger.error('Error listing bank statements', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Error listing bank statements',
    });
  }
};

/**
 * Rapprocher manuellement une transaction
 */
export const manualReconcile = async (req: AuthRequest, res: Response) => {
  try {
    const { bankTransactionId } = req.params;
    const { accountingTransactionId, accountingTransactionType } = req.body;

    if (!accountingTransactionId || !accountingTransactionType) {
      return res.status(400).json({
        success: false,
        message: 'accountingTransactionId and accountingTransactionType are required',
      });
    }

    await bankReconciliationService.manualReconcile(
      bankTransactionId,
      accountingTransactionId,
      accountingTransactionType
    );

    res.json({
      success: true,
      message: 'Transaction reconciled manually',
    });
  } catch (error: any) {
    logger.error('Error manual reconciling', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Error manual reconciling',
    });
  }
};

