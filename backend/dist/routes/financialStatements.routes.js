"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const financialStatements_controller_1 = require("../controllers/financialStatements.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(auth_middleware_1.authenticate);
router.use((0, feature_middleware_1.requireFeature)('accounting'));
/**
 * @route   GET /api/v1/financial-statements/income-statement
 * @desc    Obtenir le Compte de Résultat
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, period, compareWithPrevious
 */
router.get('/income-statement', financialStatements_controller_1.getIncomeStatement);
/**
 * @route   GET /api/v1/financial-statements/balance-sheet
 * @desc    Obtenir le Bilan
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, period
 */
router.get('/balance-sheet', financialStatements_controller_1.getBalanceSheet);
/**
 * @route   GET /api/v1/financial-statements/cash-flow
 * @desc    Obtenir le Tableau de Flux de Trésorerie
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, period
 */
router.get('/cash-flow', financialStatements_controller_1.getCashFlowStatement);
/**
 * @route   GET /api/v1/financial-statements/validate-equation
 * @desc    Valider l'équation comptable (Actif = Passif + Capitaux Propres)
 * @access  Private (Accounting feature required)
 * @query   asOfDate (optionnel)
 */
router.get('/validate-equation', financialStatements_controller_1.validateAccountingEquation);
exports.default = router;
//# sourceMappingURL=financialStatements.routes.js.map