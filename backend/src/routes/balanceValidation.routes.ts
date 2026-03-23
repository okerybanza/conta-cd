import express from 'express';
import {
  validateAccountBalance,
  validateAllBalances,
  recalculateAccountBalance,
  recalculateAllBalances,
} from '../controllers/balanceValidation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';

const router = express.Router();

// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(authenticate as any);
router.use(requireFeature('accounting') as any);

/**
 * @route   GET /api/v1/balance-validation/account/:accountId
 * @desc    Valider le solde d'un compte spécifique
 * @access  Private (Accounting feature required)
 * @query   autoCorrect (optionnel, true/false)
 */
router.get('/account/:accountId', validateAccountBalance as any);

/**
 * @route   GET /api/v1/balance-validation/all
 * @desc    Valider tous les soldes d'une entreprise
 * @access  Private (Accounting feature required)
 * @query   autoCorrect (optionnel, true/false)
 */
router.get('/all', validateAllBalances as any);

/**
 * @route   POST /api/v1/balance-validation/account/:accountId/recalculate
 * @desc    Recalculer le solde d'un compte spécifique
 * @access  Private (Accounting feature required)
 */
router.post('/account/:accountId/recalculate', recalculateAccountBalance as any);

/**
 * @route   POST /api/v1/balance-validation/recalculate-all
 * @desc    Recalculer tous les soldes d'une entreprise
 * @access  Private (Accounting feature required)
 */
router.post('/recalculate-all', recalculateAllBalances as any);

export default router;

