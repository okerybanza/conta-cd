"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const account_controller_1 = __importDefault(require("../controllers/account.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const prevent_direct_aggregate_updates_middleware_1 = require("../middleware/prevent-direct-aggregate-updates.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Toutes les routes nécessitent la fonctionnalité "accounting"
router.use((0, feature_middleware_1.requireFeature)('accounting'));
router.post('/', account_controller_1.default.create.bind(account_controller_1.default));
router.get('/', account_controller_1.default.list.bind(account_controller_1.default));
router.get('/tree', account_controller_1.default.getTree.bind(account_controller_1.default));
router.get('/by-type/:type', account_controller_1.default.findByType.bind(account_controller_1.default));
router.get('/code/:code', account_controller_1.default.getByCode.bind(account_controller_1.default));
router.get('/:id', account_controller_1.default.getById.bind(account_controller_1.default));
router.get('/:id/balance', account_controller_1.default.getTotalBalance.bind(account_controller_1.default));
// Protection contre les mises à jour directes des soldes (DOC-02)
router.put('/:id', prevent_direct_aggregate_updates_middleware_1.preventDirectBalanceUpdate, account_controller_1.default.update.bind(account_controller_1.default));
router.delete('/:id', account_controller_1.default.delete.bind(account_controller_1.default));
exports.default = router;
//# sourceMappingURL=account.routes.js.map