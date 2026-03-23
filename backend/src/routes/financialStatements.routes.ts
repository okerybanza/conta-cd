import express from 'express';
import {
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  validateAccountingEquation,
} from '../controllers/financialStatements.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';

const router = express.Router();

// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(authenticate as any);
router.use(requireFeature('accounting') as any);

/**
 * @route   GET /api/v1/financial-statements/income-statement
 * @desc    Obtenir le Compte de Résultat
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, period, compareWithPrevious
 */
router.get('/income-statement', getIncomeStatement as any);

/**
 * @route   GET /api/v1/financial-statements/balance-sheet
 * @desc    Obtenir le Bilan
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, period
 */
router.get('/balance-sheet', getBalanceSheet as any);

/**
 * @route   GET /api/v1/financial-statements/cash-flow
 * @desc    Obtenir le Tableau de Flux de Trésorerie
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, period
 */
router.get('/cash-flow', getCashFlowStatement as any);

/**
 * @route   GET /api/v1/financial-statements/validate-equation
 * @desc    Valider l'équation comptable (Actif = Passif + Capitaux Propres)
 * @access  Private (Accounting feature required)
 * @query   asOfDate (optionnel)
 */
router.get('/validate-equation', validateAccountingEquation as any);

export default router;

