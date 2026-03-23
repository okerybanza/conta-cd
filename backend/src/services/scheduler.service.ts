import cron from 'node-cron';
import logger from '../utils/logger';
import recurringInvoiceService from './recurringInvoice.service';
import reminderService from './reminder.service';
import depreciationService from './depreciation.service';
import balanceValidationService from './balanceValidation.service';
import prisma from '../config/database';

export class SchedulerService {
  private tasks: any[] = []; // cron.ScheduledTask[] - type temporaire

  /**
   * Démarrer tous les schedulers
   */
  start() {
    logger.info('Starting schedulers...');

    // Traiter les factures récurrentes - Tous les jours à 2h du matin
    const recurringTask = cron.schedule('0 2 * * *', async () => {
      logger.info('Running recurring invoices job');
      try {
        const results = await recurringInvoiceService.processRecurringInvoices();
        logger.info('Recurring invoices processed', { count: results.length });
      } catch (error: any) {
        logger.error('Error processing recurring invoices', { error: error.message });
      }
    });

    this.tasks.push(recurringTask);

    // Traiter les rappels de paiement - Tous les jours à 9h du matin
    const reminderTask = cron.schedule('0 9 * * *', async () => {
      logger.info('Running payment reminders job');
      try {
        const results = await reminderService.processPaymentReminders();
        logger.info('Payment reminders processed', { count: results.length });
      } catch (error: any) {
        logger.error('Error processing payment reminders', { error: error.message });
      }
    });

    this.tasks.push(reminderTask);

    // Générer les écritures d'amortissement - Le 1er de chaque mois à 3h du matin
    const depreciationTask = cron.schedule('0 3 1 * *', async () => {
      logger.info('Running monthly depreciation entries job');
      try {
        const results = await depreciationService.processMonthlyDepreciations();
        const successful = results.filter((r) => r.success && !r.skipped).length;
        const skipped = results.filter((r) => r.skipped).length;
        const failed = results.filter((r) => !r.success).length;
        logger.info('Monthly depreciation entries processed', {
          total: results.length,
          successful,
          skipped,
          failed,
        });
      } catch (error: any) {
        logger.error('Error processing monthly depreciation entries', {
          error: error.message,
          stack: error.stack,
        });
      }
    });

    this.tasks.push(depreciationTask);

    // Recalculer les soldes - Tous les jours à 2h30 du matin
    const balanceValidationTask = cron.schedule('30 2 * * *', async () => {
      logger.info('Running daily balance recalculation job');
      try {
        // Récupérer toutes les entreprises actives
        const companies = await prisma.companies.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true },
        });

        let totalRecalculated = 0;
        let totalAdjustment = 0;

        for (const company of companies) {
          try {
            const result = await balanceValidationService.recalculateAllBalances(company.id);
            totalRecalculated += result.recalculated;
            totalAdjustment += Number(result.totalAdjustment || 0);
            logger.info(`Balance recalculation completed for company ${company.name}`, {
              companyId: company.id,
              recalculated: result.recalculated,
              totalAdjustment: result.totalAdjustment,
            });
          } catch (error: any) {
            logger.error(`Error recalculating balances for company ${company.name}`, {
              companyId: company.id,
              error: error.message,
            });
          }
        }

        logger.info('Daily balance recalculation completed', {
          totalCompanies: companies.length,
          totalRecalculated,
          totalAdjustment,
        });
      } catch (error: any) {
        logger.error('Error processing daily balance recalculation', {
          error: error.message,
          stack: error.stack,
        });
      }
    });

    this.tasks.push(balanceValidationTask);


    // Rapport hebdomadaire - Tous les lundis à 8h
    const weeklyReportTask = cron.schedule('0 8 * * 1', async () => {
      logger.info('Running weekly report job');
      try {
        const companies = await prisma.companies.findMany({
          where: { deleted_at: null },
          select: { id: true, name: true },
          take: 100,
        });

        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);

        for (const company of companies) {
          try {
            const { default: reportingService } = await import('./reporting.service');
            const { default: emailService } = await import('./email.service');
            const { default: prismaDb } = await import('../config/database');

            const [revenue, unpaid] = await Promise.all([
              reportingService.generateRevenueReport(company.id, {
                startDate: startDate,
                endDate: now,
              }),
              reportingService.generateUnpaidInvoicesReport(company.id),
            ]);

            // Trouver l'owner de l'entreprise
            const owner = await (prismaDb as any).users.findFirst({
              where: { company_id: company.id, role: 'owner' },
              select: { email: true, first_name: true },
            });

            if (owner?.email) {
              await emailService.sendEmail({
                to: owner.email,
                subject: `Rapport hebdomadaire Conta — ${company.name}`,
                template: 'weekly-report',
                data: {
                  companyName: company.name,
                  firstName: owner.first_name || 'Cher utilisateur',
                  period: `${startDate.toLocaleDateString('fr-FR')} - ${now.toLocaleDateString('fr-FR')}`,
                  totalRevenue: revenue.totalRevenue || 0,
                  invoiceCount: revenue.totalInvoices || 0,
                  unpaidCount: unpaid.totalCount || 0,
                  unpaidAmount: unpaid.totalAmount || 0,
                },
              });
              logger.info(`Weekly report sent to ${owner.email}`, { companyId: company.id });
            }
          } catch (err: any) {
            logger.error(`Weekly report failed for company ${company.id}`, { error: err.message });
          }
        }
      } catch (error: any) {
        logger.error('Error running weekly report job', { error: error.message });
      }
    });

    this.tasks.push(weeklyReportTask);

    logger.info('Schedulers started', { taskCount: this.tasks.length });
  }

  /**
   * Arrêter tous les schedulers
   */
  stop() {
    logger.info('Stopping schedulers...');
    this.tasks.forEach((task) => task.stop());
    this.tasks = [];
    logger.info('Schedulers stopped');
  }
}

export default new SchedulerService();

