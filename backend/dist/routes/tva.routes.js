"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tva_controller_1 = require("../controllers/tva.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(auth_middleware_1.authenticate);
router.use((0, feature_middleware_1.requireFeature)('accounting'));
/**
 * @route   GET /api/v1/tva/report
 * @desc    Obtenir le rapport TVA détaillé
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, period
 */
router.get('/report', tva_controller_1.getVATReport);
/**
 * @route   GET /api/v1/tva/collected
 * @desc    Calculer la TVA collectée
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, period
 */
router.get('/collected', tva_controller_1.getVATCollected);
/**
 * @route   GET /api/v1/tva/deductible
 * @desc    Calculer la TVA déductible
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, period
 */
router.get('/deductible', tva_controller_1.getVATDeductible);
/**
 * @route   GET /api/v1/tva/to-pay
 * @desc    Calculer la TVA à payer (collectée - déductible)
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, period
 */
router.get('/to-pay', tva_controller_1.getVATToPay);
/**
 * @route   GET /api/v1/tva/declaration
 * @desc    Générer une déclaration TVA pour une période
 * @access  Private (Accounting feature required)
 * @query   period (format: YYYY-MM, ex: 2025-01)
 */
router.get('/declaration', tva_controller_1.generateVATDeclaration);
exports.default = router;
//# sourceMappingURL=tva.routes.js.map