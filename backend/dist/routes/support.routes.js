"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const support_controller_1 = __importDefault(require("../controllers/support.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Créer un ticket de support
router.post('/tickets', (req, res, next) => support_controller_1.default.createTicket(req, res, next));
// Lister les tickets de l'entreprise
router.get('/tickets', (req, res, next) => support_controller_1.default.listTickets(req, res, next));
// Récupérer un ticket spécifique
router.get('/tickets/:ticketId', (req, res, next) => support_controller_1.default.getTicket(req, res, next));
// Mettre à jour un ticket
router.patch('/tickets/:ticketId', (req, res, next) => support_controller_1.default.updateTicket(req, res, next));
exports.default = router;
//# sourceMappingURL=support.routes.js.map