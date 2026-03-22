"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const datarissage_controller_1 = __importDefault(require("../controllers/datarissage.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Compléter le datarissage
router.post('/complete', datarissage_controller_1.default.complete.bind(datarissage_controller_1.default));
// Obtenir l'état du datarissage
router.get('/status', datarissage_controller_1.default.getStatus.bind(datarissage_controller_1.default));
// Vérifier si un champ est verrouillé
router.get('/locked/:field', datarissage_controller_1.default.checkLocked.bind(datarissage_controller_1.default));
exports.default = router;
//# sourceMappingURL=datarissage.routes.js.map