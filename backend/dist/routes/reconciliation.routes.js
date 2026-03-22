"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reconciliation_controller_1 = require("../controllers/reconciliation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(auth_middleware_1.authenticate);
router.use((0, feature_middleware_1.requireFeature)('accounting'));
/**
 * @route   GET /api/v1/reconciliation/invoices
 * @desc    Réconcilier les factures avec leurs paiements
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate
 */
router.get('/invoices', reconciliation_controller_1.reconcileInvoices);
/**
 * @route   GET /api/v1/reconciliation/journal-entries
 * @desc    Réconcilier les transactions avec leurs écritures comptables
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate
 */
router.get('/journal-entries', reconciliation_controller_1.reconcileJournalEntries);
/**
 * @route   GET /api/v1/reconciliation/report
 * @desc    Générer un rapport de réconciliation complet
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate
 */
router.get('/report', reconciliation_controller_1.generateReconciliationReport);
exports.default = router;
//# sourceMappingURL=reconciliation.routes.js.map