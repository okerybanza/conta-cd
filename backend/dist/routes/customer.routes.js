"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = __importDefault(require("../controllers/customer.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes CRUD
router.post('/', customer_controller_1.default.create.bind(customer_controller_1.default));
router.get('/', customer_controller_1.default.list.bind(customer_controller_1.default));
router.get('/export', customer_controller_1.default.exportCSV.bind(customer_controller_1.default));
router.get('/:id', customer_controller_1.default.getById.bind(customer_controller_1.default));
router.put('/:id', customer_controller_1.default.update.bind(customer_controller_1.default));
router.delete('/:id', customer_controller_1.default.delete.bind(customer_controller_1.default));
exports.default = router;
//# sourceMappingURL=customer.routes.js.map