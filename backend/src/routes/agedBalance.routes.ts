import express from 'express';
import { generateAgedBalance } from '../controllers/agedBalance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';

const router = express.Router();

// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(authenticate as any);
router.use(requireFeature('accounting') as any);

/**
 * @route   GET /api/v1/aged-balance
 * @desc    Générer la Balance Âgée (créances ou dettes)
 * @access  Private (Accounting feature required)
 * @query   type (receivables|payables), asOfDate (optionnel)
 */
router.get('/', generateAgedBalance as any);

export default router;

