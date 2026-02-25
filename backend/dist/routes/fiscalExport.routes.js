"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fiscalExport_controller_1 = require("../controllers/fiscalExport.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent l'authentification et la fonctionnalité accounting
router.use(auth_middleware_1.authenticate);
router.use((0, feature_middleware_1.requireFeature)('accounting'));
/**
 * @route   GET /api/v1/fiscal-export/vat-declaration
 * @desc    Exporter la déclaration TVA
 * @access  Private (Accounting feature required)
 * @query   period (format: "2025-01"), format (pdf|excel|xml)
 */
router.get('/vat-declaration', fiscalExport_controller_1.exportVATDeclaration);
/**
 * @route   GET /api/v1/fiscal-export/fiscal-control
 * @desc    Exporter pour contrôle fiscal
 * @access  Private (Accounting feature required)
 * @query   startDate, endDate, format (excel|csv)
 */
router.get('/fiscal-control', fiscalExport_controller_1.exportFiscalControl);
exports.default = router;
//# sourceMappingURL=fiscalExport.routes.js.map