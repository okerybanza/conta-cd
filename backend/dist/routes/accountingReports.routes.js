"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accountingReports_controller_1 = require("../controllers/accountingReports.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification et la fonctionnalité accounting
router.use(auth_middleware_1.authenticate, (0, feature_middleware_1.requireFeature)('accounting'));
router.get('/sales-journal', accountingReports_controller_1.getSalesJournal);
router.get('/purchase-journal', accountingReports_controller_1.getPurchaseJournal);
router.get('/general-ledger/:accountId', accountingReports_controller_1.getGeneralLedger);
router.get('/trial-balance', accountingReports_controller_1.getTrialBalance);
router.get('/aged-balance', accountingReports_controller_1.getAgedBalance);
exports.default = router;
//# sourceMappingURL=accountingReports.routes.js.map