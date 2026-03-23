import express from 'express';
import {
  createFiscalPeriod,
  getFiscalPeriod,
  listFiscalPeriods,
  getCurrentFiscalPeriod,
  closeFiscalPeriod,
  reopenFiscalPeriod,
  lockFiscalPeriod,
  unlockFiscalPeriod,
  updateFiscalPeriod,
  deleteFiscalPeriod,
} from '../controllers/fiscalPeriod.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';

const router = express.Router();

// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(authenticate as any);
router.use(requireFeature('accounting') as any);

/**
 * @route   GET /api/v1/fiscal-periods
 * @desc    Lister les exercices comptables
 * @access  Private (Accounting feature required)
 * @query   isClosed, isLocked, year
 */
router.get('/', listFiscalPeriods as any);

/**
 * @route   GET /api/v1/fiscal-periods/current
 * @desc    Obtenir l'exercice en cours
 * @access  Private (Accounting feature required)
 */
router.get('/current', getCurrentFiscalPeriod as any);

/**
 * @route   GET /api/v1/fiscal-periods/:id
 * @desc    Obtenir un exercice par ID
 * @access  Private (Accounting feature required)
 */
router.get('/:id', getFiscalPeriod as any);

/**
 * @route   POST /api/v1/fiscal-periods
 * @desc    Créer un exercice comptable
 * @access  Private (Accounting feature required)
 */
router.post('/', createFiscalPeriod as any);

/**
 * @route   PUT /api/v1/fiscal-periods/:id
 * @desc    Mettre à jour un exercice
 * @access  Private (Accounting feature required)
 */
router.put('/:id', updateFiscalPeriod as any);

/**
 * @route   PUT /api/v1/fiscal-periods/:id/close
 * @desc    Clôturer un exercice
 * @access  Private (Accounting feature required)
 */
router.put('/:id/close', closeFiscalPeriod as any);

/**
 * @route   PUT /api/v1/fiscal-periods/:id/reopen
 * @desc    Rouvrir un exercice
 * @access  Private (Accounting feature required)
 */
router.put('/:id/reopen', reopenFiscalPeriod as any);

/**
 * @route   PUT /api/v1/fiscal-periods/:id/lock
 * @desc    Verrouiller une période
 * @access  Private (Accounting feature required)
 */
router.put('/:id/lock', lockFiscalPeriod as any);

/**
 * @route   PUT /api/v1/fiscal-periods/:id/unlock
 * @desc    Déverrouiller une période
 * @access  Private (Accounting feature required)
 */
router.put('/:id/unlock', unlockFiscalPeriod as any);

/**
 * @route   DELETE /api/v1/fiscal-periods/:id
 * @desc    Supprimer un exercice
 * @access  Private (Accounting feature required)
 */
router.delete('/:id', deleteFiscalPeriod as any);

export default router;

