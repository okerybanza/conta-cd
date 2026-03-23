import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Routes notifications
router.post('/invoice/:invoiceId', notificationController.sendInvoiceNotification.bind(notificationController) as any);
router.post('/payment/:paymentId', notificationController.sendPaymentNotification.bind(notificationController) as any);
router.post('/reminder/:invoiceId', notificationController.sendPaymentReminder.bind(notificationController) as any);
router.get('/', notificationController.listNotifications.bind(notificationController) as any);

// Routes test
router.post('/test/email', notificationController.testEmail.bind(notificationController) as any);
router.post('/test/whatsapp', notificationController.testWhatsApp.bind(notificationController) as any);

export default router;

