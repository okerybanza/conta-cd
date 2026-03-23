import express from 'express';
import {
  exportVATDeclaration,
  exportFiscalControl,
} from '../controllers/fiscalExport.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature.middleware';

const router = express.Router();

// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(authenticate as any);
router.use(requireFeature('accounting') as any);

/**
 * @route   GET /api/v1/fiscal-export/vat-declaration
 * @desc    Exporter la déclaration TVA
 * @access  Private (Accounting feature required)
 * @query   period (format: "2025-01"), format (pdf|excel|xml)
 */
router.get('/vat-declaration', exportVATDeclaration as any);

/**
 * @route   GET /api/v1/fiscal-export/fiscal-control
 * @desc    Exporter pour contrôle fiscal
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, format (excel|csv)
 */
router.get('/fiscal-control', exportFiscalControl as any);

export default router;

