"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = __importDefault(require("../controllers/audit.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes audit
router.get('/', audit_controller_1.default.getLogs.bind(audit_controller_1.default));
router.get('/verify', audit_controller_1.default.verifyIntegrity.bind(audit_controller_1.default));
router.get('/:id', audit_controller_1.default.getLog.bind(audit_controller_1.default));
exports.default = router;
//# sourceMappingURL=audit.routes.js.map