"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paypal_controller_1 = __importDefault(require("../controllers/paypal.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Créer une Order PayPal
router.post('/init', paypal_controller_1.default.createOrder.bind(paypal_controller_1.default));
// Capturer une Order PayPal
router.post('/capture', paypal_controller_1.default.captureOrder.bind(paypal_controller_1.default));
// Récupérer les détails d'une Order
router.get('/order/:orderId', paypal_controller_1.default.getOrderDetails.bind(paypal_controller_1.default));
exports.default = router;
//# sourceMappingURL=paypal.routes.js.map