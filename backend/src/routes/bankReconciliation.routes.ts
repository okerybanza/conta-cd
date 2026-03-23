import express from 'express';
import {
  importBankStatement,
  parseCSV,
  reconcileStatement,
  getBankStatement,
  listBankStatements,
  manualReconcile,
} from '../controllers/bankReconciliation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';

const router = express.Router();

// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(authenticate as any);
router.use(requireFeature('accounting') as any);

/**
 * @route   POST /api/v1/bank-reconciliation/import
 * @desc    Importer un relevé bancaire
 * @access  Private (Accounting feature required)
 */
router.post('/import', importBankStatement as any);

/**
 * @route   POST /api/v1/bank-reconciliation/parse-csv
 * @desc    Parser un fichier CSV de relevé bancaire
 * @access  Private (Accounting feature required)
 */
router.post('/parse-csv', parseCSV as any);

/**
 * @route   GET /api/v1/bank-reconciliation/statements
 * @desc    Lister les relevés bancaires
 * @access  Private (Accounting feature required)
 * @query   accountId (optionnel)
 */
router.get('/statements', listBankStatements as any);

/**
 * @route   GET /api/v1/bank-reconciliation/statements/:statementId
 * @desc    Obtenir un relevé bancaire
 * @access  Private (Accounting feature required)
 */
router.get('/statements/:statementId', getBankStatement as any);

/**
 * @route   POST /api/v1/bank-reconciliation/statements/:statementId/reconcile
 * @desc    Rapprocher un relevé bancaire
 * @access  Private (Accounting feature required)
 */
router.post('/statements/:statementId/reconcile', reconcileStatement as any);

/**
 * @route   POST /api/v1/bank-reconciliation/transactions/:bankTransactionId/reconcile
 * @desc    Rapprocher manuellement une transaction
 * @access  Private (Accounting feature required)
 */
router.post('/transactions/:bankTransactionId/reconcile', manualReconcile as any);

export default router;

