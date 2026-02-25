"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = __importDefault(require("../controllers/payment.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const idempotency_middleware_1 = require("../middleware/idempotency.middleware");
const router = (0, express_1.Router)();
// Routes protégées par authentification
router.use(auth_middleware_1.authenticate);
router.post('/', idempotency_middleware_1.idempotencyMiddleware, (req, res, next) => payment_controller_1.default.create(req, res, next));
router.get('/', (req, res, next) => payment_controller_1.default.list(req, res, next));
router.get('/:id', (req, res, next) => payment_controller_1.default.getById(req, res, next));
router.get('/invoice/:invoiceId', (req, res, next) => payment_controller_1.default.getByInvoice(req, res, next));
router.put('/:id', (req, res, next) => payment_controller_1.default.update(req, res, next));
router.delete('/:id', (req, res, next) => payment_controller_1.default.delete(req, res, next));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map