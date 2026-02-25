"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = __importDefault(require("../controllers/webhook.controller"));
const router = (0, express_1.Router)();
// Les webhooks sont publics (pas d'authentification JWT)
// mais sécurisés via tokens/signatures spécifiques
// WhatsApp Business API (Meta Cloud API)
router.get('/whatsapp', webhook_controller_1.default.whatsappVerify.bind(webhook_controller_1.default));
router.post('/whatsapp', webhook_controller_1.default.whatsapp.bind(webhook_controller_1.default));
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map