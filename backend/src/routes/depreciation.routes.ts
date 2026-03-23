import express from 'express';
import {
  createDepreciation,
  getDepreciation,
  listDepreciations,
  updateDepreciation,
  calculateMonthlyDepreciation,
  generateDepreciationEntry,
  generateDepreciationTable,
  deleteDepreciation,
} from '../controllers/depreciation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';

const router = express.Router();

// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(authenticate as any);
router.use(requireFeature('accounting') as any);

/**
 * @route   POST /api/v1/depreciations
 * @desc    Créer un plan d'amortissement
 * @access  Private (Accounting feature required)
 */
router.post('/', createDepreciation as any);

/**
 * @route   GET /api/v1/depreciations
 * @desc    Lister les plans d'amortissement
 * @access  Private (Accounting feature required)
 */
router.get('/', listDepreciations as any);

/**
 * @route   GET /api/v1/depreciations/:id
 * @desc    Obtenir un plan d'amortissement par ID
 * @access  Private (Accounting feature required)
 */
router.get('/:id', getDepreciation as any);

/**
 * @route   PUT /api/v1/depreciations/:id
 * @desc    Mettre à jour un plan d'amortissement
 * @access  Private (Accounting feature required)
 */
router.put('/:id', updateDepreciation as any);

/**
 * @route   DELETE /api/v1/depreciations/:id
 * @desc    Supprimer un plan d'amortissement
 * @access  Private (Accounting feature required)
 */
router.delete('/:id', deleteDepreciation as any);

/**
 * @route   GET /api/v1/depreciations/:id/monthly
 * @desc    Calculer l'amortissement mensuel
 * @access  Private (Accounting feature required)
 */
router.get('/:id/monthly', calculateMonthlyDepreciation as any);

/**
 * @route   POST /api/v1/depreciations/:id/generate-entry
 * @desc    Générer une écriture d'amortissement pour une période
 * @access  Private (Accounting feature required)
 */
router.post('/:id/generate-entry', generateDepreciationEntry as any);

/**
 * @route   GET /api/v1/depreciations/:id/table
 * @desc    Générer le tableau d'amortissement complet
 * @access  Private (Accounting feature required)
 */
router.get('/:id/table', generateDepreciationTable as any);

export default router;

