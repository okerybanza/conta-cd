import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import notificationService from '../services/notification.service';
import emailService from '../services/email.service';
import env from '../config/env';
// SMS service désactivé - ne garder que Email et WhatsApp
import whatsappService from '../services/whatsapp/whatsapp.service';
import { z } from 'zod';
import invoiceService from '../services/invoice.service';
import paymentService from '../services/payment.service';
import prisma from '../config/database';

const sendInvoiceNotificationSchema = z.object({
  invoiceId: z.string().uuid(),
  methods: z.array(z.enum(['email', 'whatsapp'])).min(1),
});

const sendPaymentNotificationSchema = z.object({
  paymentId: z.string().uuid(),
  methods: z.array(z.enum(['email', 'whatsapp'])).min(1),
});

const sendPaymentReminderSchema = z.object({
  methods: z.array(z.enum(['email', 'whatsapp'])).min(1),
});

const testEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().optional(),
  message: z.string().optional(),
});

const testWhatsAppSchema = z.object({
  to: z.string(),
  message: z.string().optional(),
});

export class NotificationController {
  // Envoyer notification facture
  async sendInvoiceNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { invoiceId } = req.params;
      const { methods } = sendInvoiceNotificationSchema.parse(req.body);

      // Récupérer la facture
      const companyId = getCompanyId(req);
      const invoice = await invoiceService.getById(companyId, invoiceId);

      // Préparer les données
      const notificationData = {
        invoiceId: invoice.id,
        companyId: companyId,
        customerId: invoice.customer_id,
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date.toISOString(),
        dueDate: invoice.due_date ? invoice.due_date.toISOString() : undefined,
        totalTTC: Number(invoice.total_amount),
        currency: invoice.currency || 'CDF',
        remainingBalance: Number(invoice.total_amount) - Number(invoice.paid_amount || 0),
        invoiceUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${encodeURIComponent(invoice.invoice_number)}`,
        notes: invoice.notes || undefined,
        methods,
      };

      await notificationService.sendInvoiceNotification(notificationData);

      res.json({
        success: true,
        message: 'Notification sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Envoyer notification paiement
  async sendPaymentNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { paymentId } = req.params;
      const { methods } = sendPaymentNotificationSchema.parse(req.body);

      // Récupérer le paiement
      const companyId = getCompanyId(req);
      const payment = await paymentService.getById(companyId, paymentId);

      // Récupérer la facture
      const invoice = await invoiceService.getById(companyId, payment.invoice_id);

      // Préparer les données
      const notificationData = {
        invoiceId: invoice.id,
        companyId: companyId,
        customerId: invoice.customer_id,
        invoiceNumber: invoice.invoice_number,
        paymentDate: payment.payment_date.toISOString(),
        amount: Number(payment.amount),
        currency: payment.currency || 'CDF',
        paymentMethod: payment.payment_method,
        remainingBalance: Number(invoice.total_amount) - Number(invoice.paid_amount || 0),
        methods,
      };

      await notificationService.sendPaymentNotification(notificationData);

      res.json({
        success: true,
        message: 'Notification sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Envoyer rappel de paiement
  async sendPaymentReminder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { invoiceId } = req.params;
      const { methods } = sendPaymentReminderSchema.parse(req.body);

      // Récupérer la facture
      const companyId = getCompanyId(req);
      const invoice = await invoiceService.getById(companyId, invoiceId);

      if (!invoice.due_date) {
        throw new Error('Invoice has no due date');
      }

      // Calculer les jours de retard
      const due_date = new Date(invoice.due_date);
      const today = new Date();
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - due_date.getTime()) / (1000 * 60 * 60 * 24)));

      // Préparer les données
      const reminderData = {
        invoiceId: invoice.id,
        companyId: companyId,
        customerId: invoice.customer_id,
        invoiceNumber: invoice.invoice_number,
        dueDate: invoice.due_date.toISOString(),
        remainingBalance: Number(invoice.total_amount) - Number(invoice.paid_amount || 0),
        currency: invoice.currency || 'CDF',
        daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
        invoiceUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${encodeURIComponent(invoice.invoice_number)}`,
        methods,
      };

      await notificationService.sendPaymentReminder(reminderData);

      res.json({
        success: true,
        message: 'Payment reminder sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Tester email
  async testEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { to, subject, message } = testEmailSchema.parse(req.body);

      // Tester la connexion SMTP
      const connectionOk = await emailService.testConnection();
      if (!connectionOk) {
        throw new Error('SMTP connection failed');
      }

      // Envoyer un email de test
      await emailService.sendEmail({
        from: env.SMTP_FROM || env.SMTP_USER,
        to,
        subject: subject || 'Test Email - Conta',
        template: 'welcome',
        data: {
          firstName: 'Test',
          companyName: 'Conta',
          message: message || 'Ceci est un email de test depuis Conta.',
        },
      });

      res.json({
        success: true,
        message: 'Test email sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Tester WhatsApp
  async testWhatsApp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { to, message } = testWhatsAppSchema.parse(req.body);

      if (!whatsappService.isServiceConfigured()) {
        throw new Error('WhatsApp service not configured');
      }

      const result = await whatsappService.sendText({
        to,
        message: message || 'Ceci est un message WhatsApp de test depuis Conta.',
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to send WhatsApp message');
      }

      res.json({
        success: true,
        message: 'Test WhatsApp sent successfully',
        messageId: result.providerMessageId,
      });
    } catch (error) {
      next(error);
    }
  }

  // Lister les notifications
  async listNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const companyId = getCompanyId(req);
      const where: any = {
        companyId: companyId,
      };

      if (req.query.type) {
        where.type = req.query.type;
      }

      if (req.query.status) {
        where.status = req.query.status;
      }

      const [notifications, total] = await Promise.all([
        prisma.notifications.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        prisma.notifications.count({ where }),
      ]);

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();

