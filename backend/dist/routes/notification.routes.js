"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = __importDefault(require("../controllers/notification.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes notifications
router.post('/invoice/:invoiceId', notification_controller_1.default.sendInvoiceNotification.bind(notification_controller_1.default));
router.post('/payment/:paymentId', notification_controller_1.default.sendPaymentNotification.bind(notification_controller_1.default));
router.post('/reminder/:invoiceId', notification_controller_1.default.sendPaymentReminder.bind(notification_controller_1.default));
router.get('/', notification_controller_1.default.listNotifications.bind(notification_controller_1.default));
// Routes test
router.post('/test/email', notification_controller_1.default.testEmail.bind(notification_controller_1.default));
router.post('/test/whatsapp', notification_controller_1.default.testWhatsApp.bind(notification_controller_1.default));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map