"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = __importDefault(require("../controllers/dashboard.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes dashboard
router.get('/stats', dashboard_controller_1.default.getStats.bind(dashboard_controller_1.default));
router.get('/quota-summary', dashboard_controller_1.default.getQuotaSummary.bind(dashboard_controller_1.default));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map