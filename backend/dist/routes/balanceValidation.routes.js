"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const balanceValidation_controller_1 = require("../controllers/balanceValidation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(auth_middleware_1.authenticate);
router.use((0, feature_middleware_1.requireFeature)('accounting'));
/**
 * @route   GET /api/v1/balance-validation/account/:accountId
 * @desc    Valider le solde d'un compte spécifique
 * @access  Private (Accounting feature required)
 * @query   autoCorrect (optionnel, true/false)
 */
router.get('/account/:accountId', balanceValidation_controller_1.validateAccountBalance);
/**
 * @route   GET /api/v1/balance-validation/all
 * @desc    Valider tous les soldes d'une entreprise
 * @access  Private (Accounting feature required)
 * @query   autoCorrect (optionnel, true/false)
 */
router.get('/all', balanceValidation_controller_1.validateAllBalances);
/**
 * @route   POST /api/v1/balance-validation/account/:accountId/recalculate
 * @desc    Recalculer le solde d'un compte spécifique
 * @access  Private (Accounting feature required)
 */
router.post('/account/:accountId/recalculate', balanceValidation_controller_1.recalculateAccountBalance);
/**
 * @route   POST /api/v1/balance-validation/recalculate-all
 * @desc    Recalculer tous les soldes d'une entreprise
 * @access  Private (Accounting feature required)
 */
router.post('/recalculate-all', balanceValidation_controller_1.recalculateAllBalances);
exports.default = router;
//# sourceMappingURL=balanceValidation.routes.js.map