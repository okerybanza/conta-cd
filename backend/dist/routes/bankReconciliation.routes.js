"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bankReconciliation_controller_1 = require("../controllers/bankReconciliation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(auth_middleware_1.authenticate);
router.use((0, feature_middleware_1.requireFeature)('accounting'));
/**
 * @route   POST /api/v1/bank-reconciliation/import
 * @desc    Importer un relevé bancaire
 * @access  Private (Accounting feature required)
 */
router.post('/import', bankReconciliation_controller_1.importBankStatement);
/**
 * @route   POST /api/v1/bank-reconciliation/parse-csv
 * @desc    Parser un fichier CSV de relevé bancaire
 * @access  Private (Accounting feature required)
 */
router.post('/parse-csv', bankReconciliation_controller_1.parseCSV);
/**
 * @route   GET /api/v1/bank-reconciliation/statements
 * @desc    Lister les relevés bancaires
 * @access  Private (Accounting feature required)
 * @query   accountId (optionnel)
 */
router.get('/statements', bankReconciliation_controller_1.listBankStatements);
/**
 * @route   GET /api/v1/bank-reconciliation/statements/:statementId
 * @desc    Obtenir un relevé bancaire
 * @access  Private (Accounting feature required)
 */
router.get('/statements/:statementId', bankReconciliation_controller_1.getBankStatement);
/**
 * @route   POST /api/v1/bank-reconciliation/statements/:statementId/reconcile
 * @desc    Rapprocher un relevé bancaire
 * @access  Private (Accounting feature required)
 */
router.post('/statements/:statementId/reconcile', bankReconciliation_controller_1.reconcileStatement);
/**
 * @route   POST /api/v1/bank-reconciliation/transactions/:bankTransactionId/reconcile
 * @desc    Rapprocher manuellement une transaction
 * @access  Private (Accounting feature required)
 */
router.post('/transactions/:bankTransactionId/reconcile', bankReconciliation_controller_1.manualReconcile);
exports.default = router;
//# sourceMappingURL=bankReconciliation.routes.js.map