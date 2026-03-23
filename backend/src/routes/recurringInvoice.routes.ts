import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import recurringInvoiceController from '../controllers/recurringInvoice.controller';

const router = Router();

/**
 * @route   POST /api/v1/recurring-invoices
 * @desc    Créer une facture récurrente
 * @access  Private
 */
router.post('/', authenticate as any, recurringInvoiceController.create.bind(recurringInvoiceController) as any);

/**
 * @route   GET /api/v1/recurring-invoices
 * @desc    Lister les factures récurrentes
 * @access  Private
 */
router.get('/', authenticate as any, recurringInvoiceController.list.bind(recurringInvoiceController) as any);

/**
 * @route   GET /api/v1/recurring-invoices/:id
 * @desc    Obtenir une facture récurrente
 * @access  Private
 */
router.get('/:id', authenticate as any, recurringInvoiceController.getById.bind(recurringInvoiceController) as any);

/**
 * @route   PUT /api/v1/recurring-invoices/:id
 * @desc    Mettre à jour une facture récurrente
 * @access  Private
 */
router.put('/:id', authenticate as any, recurringInvoiceController.update.bind(recurringInvoiceController) as any);

/**
 * @route   DELETE /api/v1/recurring-invoices/:id
 * @desc    Supprimer une facture récurrente
 * @access  Private
 */
router.delete('/:id', authenticate as any, recurringInvoiceController.delete.bind(recurringInvoiceController) as any);

/**
 * @route   POST /api/v1/recurring-invoices/:id/generate
 * @desc    Générer manuellement la prochaine facture
 * @access  Private
 */
router.post('/:id/generate', authenticate as any, recurringInvoiceController.generate.bind(recurringInvoiceController) as any);

/**
 * @route   GET /api/v1/recurring-invoices/:id/history
 * @desc    Obtenir l'historique des factures générées
 * @access  Private
 */
router.get('/:id/history', authenticate as any, recurringInvoiceController.getHistory.bind(recurringInvoiceController) as any);

export default router;

