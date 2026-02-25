"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const recurringInvoice_controller_1 = __importDefault(require("../controllers/recurringInvoice.controller"));
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/recurring-invoices
 * @desc    Créer une facture récurrente
 * @access  Private
 */
router.post('/', auth_middleware_1.authenticate, recurringInvoice_controller_1.default.create.bind(recurringInvoice_controller_1.default));
/**
 * @route   GET /api/v1/recurring-invoices
 * @desc    Lister les factures récurrentes
 * @access  Private
 */
router.get('/', auth_middleware_1.authenticate, recurringInvoice_controller_1.default.list.bind(recurringInvoice_controller_1.default));
/**
 * @route   GET /api/v1/recurring-invoices/:id
 * @desc    Obtenir une facture récurrente
 * @access  Private
 */
router.get('/:id', auth_middleware_1.authenticate, recurringInvoice_controller_1.default.getById.bind(recurringInvoice_controller_1.default));
/**
 * @route   PUT /api/v1/recurring-invoices/:id
 * @desc    Mettre à jour une facture récurrente
 * @access  Private
 */
router.put('/:id', auth_middleware_1.authenticate, recurringInvoice_controller_1.default.update.bind(recurringInvoice_controller_1.default));
/**
 * @route   DELETE /api/v1/recurring-invoices/:id
 * @desc    Supprimer une facture récurrente
 * @access  Private
 */
router.delete('/:id', auth_middleware_1.authenticate, recurringInvoice_controller_1.default.delete.bind(recurringInvoice_controller_1.default));
/**
 * @route   POST /api/v1/recurring-invoices/:id/generate
 * @desc    Générer manuellement la prochaine facture
 * @access  Private
 */
router.post('/:id/generate', auth_middleware_1.authenticate, recurringInvoice_controller_1.default.generate.bind(recurringInvoice_controller_1.default));
/**
 * @route   GET /api/v1/recurring-invoices/:id/history
 * @desc    Obtenir l'historique des factures générées
 * @access  Private
 */
router.get('/:id/history', auth_middleware_1.authenticate, recurringInvoice_controller_1.default.getHistory.bind(recurringInvoice_controller_1.default));
exports.default = router;
//# sourceMappingURL=recurringInvoice.routes.js.map