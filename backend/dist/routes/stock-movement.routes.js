"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stock_movement_controller_1 = __importDefault(require("../controllers/stock-movement.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes Stock Movements
router.post('/', stock_movement_controller_1.default.create.bind(stock_movement_controller_1.default));
router.get('/', stock_movement_controller_1.default.list.bind(stock_movement_controller_1.default));
router.get('/:id', stock_movement_controller_1.default.getById.bind(stock_movement_controller_1.default));
router.post('/:id/validate', stock_movement_controller_1.default.validate.bind(stock_movement_controller_1.default));
router.post('/:id/reverse', stock_movement_controller_1.default.reverse.bind(stock_movement_controller_1.default));
// Route utilitaire pour calcul direct
router.get('/products/:productId/stock', stock_movement_controller_1.default.calculateStock.bind(stock_movement_controller_1.default));
exports.default = router;
//# sourceMappingURL=stock-movement.routes.js.map