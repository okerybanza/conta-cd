"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const depreciation_controller_1 = require("../controllers/depreciation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(auth_middleware_1.authenticate);
router.use((0, feature_middleware_1.requireFeature)('accounting'));
/**
 * @route   POST /api/v1/depreciations
 * @desc    Créer un plan d'amortissement
 * @access  Private (Accounting feature required)
 */
router.post('/', depreciation_controller_1.createDepreciation);
/**
 * @route   GET /api/v1/depreciations
 * @desc    Lister les plans d'amortissement
 * @access  Private (Accounting feature required)
 */
router.get('/', depreciation_controller_1.listDepreciations);
/**
 * @route   GET /api/v1/depreciations/:id
 * @desc    Obtenir un plan d'amortissement par ID
 * @access  Private (Accounting feature required)
 */
router.get('/:id', depreciation_controller_1.getDepreciation);
/**
 * @route   PUT /api/v1/depreciations/:id
 * @desc    Mettre à jour un plan d'amortissement
 * @access  Private (Accounting feature required)
 */
router.put('/:id', depreciation_controller_1.updateDepreciation);
/**
 * @route   DELETE /api/v1/depreciations/:id
 * @desc    Supprimer un plan d'amortissement
 * @access  Private (Accounting feature required)
 */
router.delete('/:id', depreciation_controller_1.deleteDepreciation);
/**
 * @route   GET /api/v1/depreciations/:id/monthly
 * @desc    Calculer l'amortissement mensuel
 * @access  Private (Accounting feature required)
 */
router.get('/:id/monthly', depreciation_controller_1.calculateMonthlyDepreciation);
/**
 * @route   POST /api/v1/depreciations/:id/generate-entry
 * @desc    Générer une écriture d'amortissement pour une période
 * @access  Private (Accounting feature required)
 */
router.post('/:id/generate-entry', depreciation_controller_1.generateDepreciationEntry);
/**
 * @route   GET /api/v1/depreciations/:id/table
 * @desc    Générer le tableau d'amortissement complet
 * @access  Private (Accounting feature required)
 */
router.get('/:id/table', depreciation_controller_1.generateDepreciationTable);
exports.default = router;
//# sourceMappingURL=depreciation.routes.js.map