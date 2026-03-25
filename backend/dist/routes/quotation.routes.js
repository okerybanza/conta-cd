"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quotation_controller_1 = __importDefault(require("../controllers/quotation.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes CRUD
router.post('/', quotation_controller_1.default.create.bind(quotation_controller_1.default));
router.get('/', quotation_controller_1.default.list.bind(quotation_controller_1.default));
router.get('/:id', quotation_controller_1.default.getById.bind(quotation_controller_1.default));
router.get('/:id/pdf', quotation_controller_1.default.generatePDF.bind(quotation_controller_1.default));
router.put('/:id', quotation_controller_1.default.update.bind(quotation_controller_1.default));
router.delete('/:id', quotation_controller_1.default.delete.bind(quotation_controller_1.default));
// Route spéciale: convertir devis en facture
router.post('/:id/convert-to-invoice', quotation_controller_1.default.convertToInvoice.bind(quotation_controller_1.default));
router.post('/:id/convert', quotation_controller_1.default.convertToInvoice.bind(quotation_controller_1.default));
exports.default = router;
//# sourceMappingURL=quotation.routes.js.map