"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contract_controller_1 = __importDefault(require("../controllers/contract.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Templates de contrats
router.get('/templates', contract_controller_1.default.getTemplates.bind(contract_controller_1.default));
// CRUD des contrats
router.post('/', contract_controller_1.default.create.bind(contract_controller_1.default));
router.get('/', contract_controller_1.default.list.bind(contract_controller_1.default));
router.get('/:id', contract_controller_1.default.getById.bind(contract_controller_1.default));
router.put('/:id', contract_controller_1.default.update.bind(contract_controller_1.default));
router.delete('/:id', contract_controller_1.default.cancel.bind(contract_controller_1.default));
// Signatures
router.post('/:id/sign/company', contract_controller_1.default.signByCompany.bind(contract_controller_1.default));
router.post('/:id/sign/accountant', contract_controller_1.default.signByAccountant.bind(contract_controller_1.default));
exports.default = router;
//# sourceMappingURL=contract.routes.js.map