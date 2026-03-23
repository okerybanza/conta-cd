import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import notificationService from './notification.service';
import env from '../config/env';

export class ReminderService {
  /**
   * Traiter les rappels de paiement pour les factures en attente
   */
  async processPaymentReminders() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Récupérer toutes les entreprises avec rappels activés
    const companies = await prisma.companies.findMany({
      where: {
        reminders_enabled: true,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        reminders_enabled: true,
        reminder_days_before: true,
        reminder_days_after: true,
        reminder_frequency: true,
        reminder_methods: true,
      },
    });

    logger.info('Processing payment reminders', { companyCount: companies.length });

    const results = [];

    for (const company of companies) {
      try {
        // Calculer les dates pour les rappels
        const daysBefore = company.reminder_days_before || 3;
        const daysAfter = company.reminder_days_after || 7;

        // Date avant échéance (rappels préventifs)
        const beforeDate = new Date(today);
        beforeDate.setDate(beforeDate.getDate() + daysBefore);

        // Date après échéance (rappels de retard)
        const afterDate = new Date(today);
        afterDate.setDate(afterDate.getDate() - daysAfter);

        // Récupérer les factures qui nécessitent un rappel
        const invoices = await prisma.invoices.findMany({
          where: {
            company_id: company.id,
            status: { in: ['sent', 'partially_paid'] },
            deleted_at: null,
            OR: [
              // Factures avec échéance dans X jours (rappels préventifs)
              {
                due_date: {
                  gte: new Date(beforeDate.getTime() - 24 * 60 * 60 * 1000), // J-1 pour éviter doublons
                  lte: beforeDate,
                },
                sent_at: {
                  // Pas de rappel si déjà envoyé aujourd'hui
                  not: {
                    gte: new Date(today),
                  },
                },
              },
              // Factures en retard (rappels de retard)
              {
                due_date: {
                  lte: afterDate,
                },
                sent_at: {
                  // Pas de rappel si déjà envoyé aujourd'hui
                  not: {
                    gte: new Date(today),
                  },
                },
              },
            ],
          },
          include: {
            customers: {
              select: {
                id: true,
                type: true,
                first_name: true,
                last_name: true,
                business_name: true,
                email: true,
                phone: true,
                mobile: true,
              },
            },
            payments: {
              where: {
                status: 'confirmed',
                deleted_at: null,
              },
              select: {
                amount: true,
              },
            },
          },
        });

        // Filtrer les factures avec solde restant > 0
        const invoicesWithBalance = invoices.filter((invoice) => {
          const totalAmount = Number(invoice.total_amount);
          const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
          const remainingBalance = totalAmount - paidAmount;
          return remainingBalance > 0;
        });

        logger.info('Found invoices for reminders', {
          companyId: company.id,
          count: invoicesWithBalance.length,
        });

        for (const invoice of invoicesWithBalance) {
          try {
            // Calculer le nombre de jours de retard
            const daysOverdue = invoice.due_date
              ? Math.floor((today.getTime() - new Date(invoice.due_date).getTime()) / (24 * 60 * 60 * 1000))
              : 0;

            // Déterminer les méthodes de rappel
            const methods: ('email' | 'whatsapp')[] = (company.reminder_methods as any[]) || ['email'];

            // Calculer le solde restant
            const totalAmount = Number(invoice.total_amount);
            const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            const remainingBalance = totalAmount - paidAmount;

            // Envoyer le rappel
            await notificationService.sendPaymentReminder({
              invoiceId: invoice.id,
              companyId: company.id,
              customerId: invoice.customer_id,
              invoiceNumber: invoice.invoice_number,
              dueDate: invoice.due_date?.toISOString() || new Date().toISOString(),
              remainingBalance: remainingBalance,
              currency: invoice.currency || 'CDF',
              daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
              invoiceUrl: `${env.FRONTEND_URL}/invoices/${invoice.id}`,
              methods,
            });

            // Mettre à jour sentAt pour éviter les doublons
            await prisma.invoices.update({
              where: { id: invoice.id },
              data: { sent_at: new Date() },
            });

            results.push({
              companyId: company.id,
              invoiceId: invoice.id,
              success: true,
            });

            logger.info('Payment reminder sent', {
              companyId: company.id,
              invoiceId: invoice.id,
              daysOverdue,
            });
          } catch (error: any) {
            logger.error('Failed to send reminder for invoice', {
              companyId: company.id,
              invoiceId: invoice.id,
              error: error.message,
            });
            results.push({
              companyId: company.id,
              invoiceId: invoice.id,
              success: false,
              error: error.message,
            });
          }
        }
      } catch (error: any) {
        logger.error('Error processing reminders for company', {
          companyId: company.id,
          error: error.message,
        });
        results.push({
          companyId: company.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Obtenir les statistiques des rappels pour une entreprise
   */
  async getReminderStats(companyId: string) {
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        reminders_enabled: true,
        reminder_days_before: true,
        reminder_days_after: true,
        reminder_frequency: true,
        reminder_methods: true,
      },
    });

    if (!company) {
      throw new CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysBefore = company.reminder_days_before || 3;
    const daysAfter = company.reminder_days_after || 7;

    const beforeDate = new Date(today);
    beforeDate.setDate(beforeDate.getDate() + daysBefore);

    const afterDate = new Date(today);
    afterDate.setDate(afterDate.getDate() - daysAfter);

    // Factures nécessitant un rappel préventif
    const preventiveInvoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        status: { in: ['sent', 'overdue'] },
        deleted_at: null,
        due_date: {
          gte: today,
          lte: beforeDate,
        },
      },
      include: {
        payments: {
          where: {
            status: 'confirmed',
            deleted_at: null,
          },
          select: {
            amount: true,
          },
        },
      },
    });

    // Filtrer celles avec solde restant > 0
    const preventiveCount = preventiveInvoices.filter((invoice) => {
      const totalAmount = Number(invoice.total_amount);
      const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      return totalAmount - paidAmount > 0;
    }).length;

    // Factures en retard nécessitant un rappel
    const overdueInvoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        status: { in: ['sent', 'overdue'] },
        deleted_at: null,
        due_date: {
          lte: afterDate,
        },
      },
      include: {
        payments: {
          where: {
            status: 'confirmed',
            deleted_at: null,
          },
          select: {
            amount: true,
          },
        },
      },
    });

    // Filtrer celles avec solde restant > 0
    const overdueCount = overdueInvoices.filter((invoice) => {
      const totalAmount = Number(invoice.total_amount);
      const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      return totalAmount - paidAmount > 0;
    }).length;

    return {
      enabled: company.reminders_enabled || false,
      daysBefore: company.reminder_days_before || 3,
      daysAfter: company.reminder_days_after || 7,
      frequency: company.reminder_frequency || 'daily',
      methods: company.reminder_methods || ['email'],
      preventiveCount,
      overdueCount,
      totalPending: preventiveCount + overdueCount,
    };
  }
}

export default new ReminderService();

