"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fiscalPeriod_controller_1 = require("../controllers/fiscalPeriod.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(auth_middleware_1.authenticate);
router.use((0, feature_middleware_1.requireFeature)('accounting'));
/**
 * @route   GET /api/v1/fiscal-periods
 * @desc    Lister les exercices comptables
 * @access  Private (Accounting feature required)
 * @query   isClosed, isLocked, year
 */
router.get('/', fiscalPeriod_controller_1.listFiscalPeriods);
/**
 * @route   GET /api/v1/fiscal-periods/current
 * @desc    Obtenir l'exercice en cours
 * @access  Private (Accounting feature required)
 */
router.get('/current', fiscalPeriod_controller_1.getCurrentFiscalPeriod);
/**
 * @route   GET /api/v1/fiscal-periods/:id
 * @desc    Obtenir un exercice par ID
 * @access  Private (Accounting feature required)
 */
router.get('/:id', fiscalPeriod_controller_1.getFiscalPeriod);
/**
 * @route   POST /api/v1/fiscal-periods
 * @desc    Créer un exercice comptable
 * @access  Private (Accounting feature required)
 */
router.post('/', fiscalPeriod_controller_1.createFiscalPeriod);
/**
 * @route   PUT /api/v1/fiscal-periods/:id
 * @desc    Mettre à jour un exercice
 * @access  Private (Accounting feature required)
 */
router.put('/:id', fiscalPeriod_controller_1.updateFiscalPeriod);
/**
 * @route   PUT /api/v1/fiscal-periods/:id/close
 * @desc    Clôturer un exercice
 * @access  Private (Accounting feature required)
 */
router.put('/:id/close', fiscalPeriod_controller_1.closeFiscalPeriod);
/**
 * @route   PUT /api/v1/fiscal-periods/:id/reopen
 * @desc    Rouvrir un exercice
 * @access  Private (Accounting feature required)
 */
router.put('/:id/reopen', fiscalPeriod_controller_1.reopenFiscalPeriod);
/**
 * @route   PUT /api/v1/fiscal-periods/:id/lock
 * @desc    Verrouiller une période
 * @access  Private (Accounting feature required)
 */
router.put('/:id/lock', fiscalPeriod_controller_1.lockFiscalPeriod);
/**
 * @route   PUT /api/v1/fiscal-periods/:id/unlock
 * @desc    Déverrouiller une période
 * @access  Private (Accounting feature required)
 */
router.put('/:id/unlock', fiscalPeriod_controller_1.unlockFiscalPeriod);
/**
 * @route   DELETE /api/v1/fiscal-periods/:id
 * @desc    Supprimer un exercice
 * @access  Private (Accounting feature required)
 */
router.delete('/:id', fiscalPeriod_controller_1.deleteFiscalPeriod);
exports.default = router;
//# sourceMappingURL=fiscalPeriod.routes.js.map