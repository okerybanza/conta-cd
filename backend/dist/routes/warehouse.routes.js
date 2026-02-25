"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const warehouse_controller_1 = __importDefault(require("../controllers/warehouse.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Toutes les routes nécessitent la fonctionnalité "stock" (PREMIUM)
router.use((0, feature_middleware_1.requireFeature)('stock'));
router.post('/', warehouse_controller_1.default.create.bind(warehouse_controller_1.default));
router.get('/', warehouse_controller_1.default.list.bind(warehouse_controller_1.default));
router.get('/default', warehouse_controller_1.default.getDefault.bind(warehouse_controller_1.default));
router.get('/:id', warehouse_controller_1.default.getById.bind(warehouse_controller_1.default));
router.put('/:id', warehouse_controller_1.default.update.bind(warehouse_controller_1.default));
router.delete('/:id', warehouse_controller_1.default.delete.bind(warehouse_controller_1.default));
exports.default = router;
//# sourceMappingURL=warehouse.routes.js.map