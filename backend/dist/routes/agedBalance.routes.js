"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const agedBalance_controller_1 = require("../controllers/agedBalance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(auth_middleware_1.authenticate);
router.use((0, feature_middleware_1.requireFeature)('accounting'));
/**
 * @route   GET /api/v1/aged-balance
 * @desc    Générer la Balance Âgée (créances ou dettes)
 * @access  Private (Accounting feature required)
 * @query   type (receivables|payables), asOfDate (optionnel)
 */
router.get('/', agedBalance_controller_1.generateAgedBalance);
exports.default = router;
//# sourceMappingURL=agedBalance.routes.js.map