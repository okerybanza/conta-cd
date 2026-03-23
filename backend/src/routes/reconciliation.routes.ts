import express from 'express';
import {
  reconcileInvoices,
  reconcileJournalEntries,
  generateReconciliationReport,
} from '../controllers/reconciliation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';

const router = express.Router();

// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(authenticate as any);
router.use(requireFeature('accounting') as any);

/**
 * @route   GET /api/v1/reconciliation/invoices
 * @desc    Réconcilier les factures avec leurs paiements
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate
 */
router.get('/invoices', reconcileInvoices as any);

/**
 * @route   GET /api/v1/reconciliation/journal-entries
 * @desc    Réconcilier les transactions avec leurs écritures comptables
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate
 */
router.get('/journal-entries', reconcileJournalEntries as any);

/**
 * @route   GET /api/v1/reconciliation/report
 * @desc    Générer un rapport de réconciliation complet
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate
 */
router.get('/report', generateReconciliationReport as any);

export default router;

