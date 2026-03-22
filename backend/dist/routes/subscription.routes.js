"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_controller_1 = __importDefault(require("../controllers/subscription.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
router.get('/', subscription_controller_1.default.getActive.bind(subscription_controller_1.default));
router.get('/quota-summary', subscription_controller_1.default.getQuotaSummary.bind(subscription_controller_1.default));
router.post('/', subscription_controller_1.default.create.bind(subscription_controller_1.default));
router.put('/upgrade', subscription_controller_1.default.upgrade.bind(subscription_controller_1.default));
router.post('/cancel', subscription_controller_1.default.cancel.bind(subscription_controller_1.default));
router.post('/renew', subscription_controller_1.default.renew.bind(subscription_controller_1.default));
exports.default = router;
//# sourceMappingURL=subscription.routes.js.map