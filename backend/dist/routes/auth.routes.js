"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const router = (0, express_1.Router)();
// Routes publiques avec rate limiting
router.post('/register', rate_limit_middleware_1.registrationRateLimiter, auth_controller_1.default.register.bind(auth_controller_1.default));
router.post('/login', rate_limit_middleware_1.authRateLimiter, auth_controller_1.default.login.bind(auth_controller_1.default));
router.post('/verify-email', auth_controller_1.default.verifyEmail.bind(auth_controller_1.default));
router.post('/resend-verification', rate_limit_middleware_1.emailVerificationRateLimiter, auth_controller_1.default.resendEmailVerification.bind(auth_controller_1.default));
router.post('/refresh', auth_controller_1.default.refresh.bind(auth_controller_1.default));
router.post('/forgot-password', rate_limit_middleware_1.passwordResetRateLimiter, auth_controller_1.default.forgotPassword.bind(auth_controller_1.default));
router.post('/reset-password', auth_controller_1.default.resetPassword.bind(auth_controller_1.default));
router.post('/logout', auth_controller_1.default.logout.bind(auth_controller_1.default));
// Route de diagnostic / QA (uniquement en environnement non-production)
router.get('/dev/email-status', auth_controller_1.default.emailStatus.bind(auth_controller_1.default));
// Routes protégées
router.get('/me', auth_middleware_1.authenticate, (req, res, next) => auth_controller_1.default.me(req, res, next));
router.post('/2fa/enable', auth_middleware_1.authenticate, (req, res, next) => auth_controller_1.default.enable2FA(req, res, next));
router.post('/2fa/verify', auth_middleware_1.authenticate, (req, res, next) => auth_controller_1.default.verify2FA(req, res, next));
router.post('/2fa/disable', auth_middleware_1.authenticate, (req, res, next) => auth_controller_1.default.disable2FA(req, res, next));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map