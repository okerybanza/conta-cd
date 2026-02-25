"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ACCT-006: Workflow d'approbation générique
 */
const express_1 = require("express");
const approvalWorkflow_controller_1 = __importDefault(require("../controllers/approvalWorkflow.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', (req, res, next) => approvalWorkflow_controller_1.default.request(req, res, next));
router.get('/', (req, res, next) => approvalWorkflow_controller_1.default.list(req, res, next));
router.post('/:id/approve', (req, res, next) => approvalWorkflow_controller_1.default.approve(req, res, next));
router.post('/:id/reject', (req, res, next) => approvalWorkflow_controller_1.default.reject(req, res, next));
exports.default = router;
//# sourceMappingURL=approvalWorkflow.routes.js.map