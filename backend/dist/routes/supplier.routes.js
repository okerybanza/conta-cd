"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplier_controller_1 = __importDefault(require("../controllers/supplier.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes pour les fournisseurs
router.post('/', supplier_controller_1.default.create.bind(supplier_controller_1.default));
router.get('/', supplier_controller_1.default.list.bind(supplier_controller_1.default));
router.get('/:id', supplier_controller_1.default.getById.bind(supplier_controller_1.default));
router.put('/:id', supplier_controller_1.default.update.bind(supplier_controller_1.default));
router.delete('/:id', supplier_controller_1.default.delete.bind(supplier_controller_1.default));
exports.default = router;
//# sourceMappingURL=supplier.routes.js.map