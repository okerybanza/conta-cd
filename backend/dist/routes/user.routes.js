"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Avatar du compte connecté (accessible à tout utilisateur authentifié)
router.post('/me/avatar', upload_middleware_1.uploadAvatar.single('avatar'), upload_middleware_1.handleUploadError, user_controller_1.default.uploadAvatar.bind(user_controller_1.default));
// Seuls les admins peuvent gérer les utilisateurs
router.use((0, auth_middleware_1.requireRole)('admin'));
// Routes de gestion des utilisateurs
router.post('/invite', user_controller_1.default.invite.bind(user_controller_1.default));
router.post('/', user_controller_1.default.create.bind(user_controller_1.default));
router.get('/', user_controller_1.default.list.bind(user_controller_1.default));
router.get('/:id', user_controller_1.default.getById.bind(user_controller_1.default));
router.put('/:id', user_controller_1.default.update.bind(user_controller_1.default));
router.delete('/:id', user_controller_1.default.delete.bind(user_controller_1.default));
router.post('/:id/reset-password', user_controller_1.default.resetPassword.bind(user_controller_1.default));
exports.default = router;
//# sourceMappingURL=user.routes.js.map