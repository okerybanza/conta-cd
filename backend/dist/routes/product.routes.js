"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = __importDefault(require("../controllers/product.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const prevent_direct_aggregate_updates_middleware_1 = require("../middleware/prevent-direct-aggregate-updates.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes CRUD
router.post('/', product_controller_1.default.create.bind(product_controller_1.default));
router.get('/', product_controller_1.default.list.bind(product_controller_1.default));
router.get('/export', product_controller_1.default.exportCSV.bind(product_controller_1.default));
router.get('/categories', product_controller_1.default.getCategories.bind(product_controller_1.default));
router.get('/stock/alerts', product_controller_1.default.getStockAlerts.bind(product_controller_1.default));
router.get('/:id', product_controller_1.default.getById.bind(product_controller_1.default));
// Protection contre les mises à jour directes du stock (DOC-02)
router.put('/:id', prevent_direct_aggregate_updates_middleware_1.preventDirectStockUpdate, product_controller_1.default.update.bind(product_controller_1.default));
router.delete('/:id', product_controller_1.default.delete.bind(product_controller_1.default));
exports.default = router;
//# sourceMappingURL=product.routes.js.map