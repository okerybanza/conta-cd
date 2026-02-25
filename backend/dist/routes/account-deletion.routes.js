"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const account_deletion_controller_1 = __importDefault(require("../controllers/account-deletion.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Routes de gestion de suppression/restauration de comptes
 */
// Route publique : restaurer un compte
router.post('/restore', account_deletion_controller_1.default.restoreAccount);
// Route publique : vérifier si un email peut être réutilisé
router.post('/check-email', account_deletion_controller_1.default.checkEmailReusability);
// Route publique : obtenir les infos d'un compte supprimé
router.get('/deleted-info', account_deletion_controller_1.default.getDeletedAccountInfo);
// Route protégée : supprimer un compte (son propre compte ou un autre si admin)
router.delete('/delete/:userId?', auth_middleware_1.authenticate, account_deletion_controller_1.default.deleteAccount);
exports.default = router;
//# sourceMappingURL=account-deletion.routes.js.map