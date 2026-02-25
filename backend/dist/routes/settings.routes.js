"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = __importDefault(require("../controllers/settings.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const datarissage_middleware_1 = require("../middleware/datarissage.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes paramètres entreprise
router.get('/company', settings_controller_1.default.getCompanySettings.bind(settings_controller_1.default));
// Protéger les champs verrouillés après datarissage
router.put('/company', (0, datarissage_middleware_1.preventLockedField)('currency', 'businessType'), settings_controller_1.default.updateCompanySettings.bind(settings_controller_1.default));
router.post('/company/logo/upload', upload_middleware_1.uploadLogo.single('logo'), upload_middleware_1.handleUploadError, settings_controller_1.default.uploadLogo.bind(settings_controller_1.default));
router.put('/company/logo', settings_controller_1.default.updateLogo.bind(settings_controller_1.default));
// Routes paramètres utilisateur
router.get('/user', settings_controller_1.default.getUserSettings.bind(settings_controller_1.default));
router.put('/user', settings_controller_1.default.updateUserSettings.bind(settings_controller_1.default));
router.post('/user/change-password', settings_controller_1.default.changePassword.bind(settings_controller_1.default));
exports.default = router;
//# sourceMappingURL=settings.routes.js.map