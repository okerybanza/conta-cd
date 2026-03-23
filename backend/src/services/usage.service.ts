import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { randomUUID } from 'crypto';

export type UsageMetric =
  | 'customers'
  | 'products'
  | 'users'
  | 'emails_sent'
  // | 'sms_sent' // SMS désactivé - ne garder que Email et WhatsApp
  | 'whatsapp_sent'
  | 'suppliers'
  | 'expenses'
  | 'invoices'
  | 'recurring_invoices'
  | 'storage'; // Stockage en bytes

export class UsageService {
  /**
   * Obtenir la période actuelle (format: "YYYY-MM")
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Incrémenter un compteur d'usage
   */
  async increment(
    companyId: string,
    metric: UsageMetric,
    amount: number = 1,
    period?: string
  ): Promise<void> {
    const currentPeriod = period || this.getCurrentPeriod();
    const periodDate = new Date(`${currentPeriod}-01T00:00:00.000Z`);

    await prisma.usages.upsert({
      where: {
        company_id_metric_period_period_date: {
          company_id: companyId,
          metric: metric as string,
          period: currentPeriod,
          period_date: periodDate,
        },
      },
      update: {
        value: {
          increment: amount,
        },
      },
      create: {
        id: randomUUID(),
        company_id: companyId,
        period: currentPeriod,
        period_date: periodDate,
        metric,
        value: amount,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    logger.debug(`Usage incremented: ${metric}`, {
      companyId,
      period: currentPeriod,
      amount,
    });
  }

  /**
   * Décrémenter un compteur d'usage
   */
  async decrement(
    companyId: string,
    metric: UsageMetric,
    amount: number = 1,
    period?: string
  ): Promise<void> {
    const currentPeriod = period || this.getCurrentPeriod();
    const periodDate = new Date(`${currentPeriod}-01T00:00:00.000Z`);

    const usage = await prisma.usages.findUnique({
      where: {
        company_id_metric_period_period_date: {
          company_id: companyId,
          metric: metric as string,
          period: currentPeriod,
          period_date: periodDate,
        },
      },
    });

    if (usage) {
      const newValue = Math.max(0, Number(usage.value) - amount);
      await prisma.usages.update({
        where: {
          company_id_metric_period_period_date: {
            company_id: companyId,
            metric: metric as string,
            period: currentPeriod,
            period_date: periodDate,
          },
        },
        data: {
          value: newValue,
        },
      });
    }

    logger.debug(`Usage decremented: ${metric}`, {
      companyId,
      period: currentPeriod,
      amount,
    });
  }

  /**
   * Obtenir la valeur d'un compteur
   */
  async get(
    companyId: string,
    metric: UsageMetric,
    period?: string
  ): Promise<number> {
    const currentPeriod = period || this.getCurrentPeriod();
    const periodDate = new Date(`${currentPeriod}-01T00:00:00.000Z`);

    const usage = await prisma.usages.findUnique({
      where: {
        company_id_metric_period_period_date: {
          company_id: companyId,
          metric: metric as string,
          period: currentPeriod,
          period_date: periodDate,
        },
      },
    });

    return usage ? Number(usage.value) : 0;
  }

  /**
   * Vérifier si une limite est atteinte
   */
  async checkLimit(
    companyId: string,
    metric: UsageMetric,
    limit: number | null
  ): Promise<boolean> {
    // null signifie illimité
    if (limit === null) {
      return false; // Pas de limite, donc pas atteinte
    }

    const currentUsage = await this.get(companyId, metric);
    return currentUsage >= limit;
  }

  /**
   * Obtenir tous les usages d'une entreprise pour la période actuelle
   */
  async getAll(companyId: string, period?: string): Promise<Record<UsageMetric, number>> {
    const currentPeriod = period || this.getCurrentPeriod();

    const usages = await prisma.usages.findMany({
      where: {
        company_id: companyId,
        period: currentPeriod,
      },
    });

    const result: Record<string, number> = {};
    for (const usage of usages) {
      result[usage.metric] = Number(usage.value);
    }

    return result as Record<UsageMetric, number>;
  }

  /**
   * Réinitialiser les compteurs pour une nouvelle période
   * (Appelé automatiquement au début de chaque mois)
   */
  async resetPeriod(companyId: string, period: string): Promise<void> {
    await prisma.usages.deleteMany({
      where: {
        company_id: companyId,
        period,
      },
    });

    logger.info(`Usage reset for period: ${period}`, { companyId });
  }

  /**
   * Obtenir l'usage d'une métrique pour plusieurs périodes
   */
  async getHistory(
    companyId: string,
    metric: UsageMetric,
    months: number = 12
  ): Promise<Array<{ period: string; count: number }>> {
    const now = new Date();
    const periods: string[] = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      periods.push(`${year}-${month}`);
    }

    const usages = await prisma.usages.findMany({
      where: {
        company_id: companyId,
        metric,
        period: {
          in: periods,
        },
      },
      orderBy: {
        period: 'desc',
      },
    });

    // Créer un map pour accès rapide
    const usageMap = new Map(usages.map((u) => [u.period, Number(u.value)]));

    // Retourner toutes les périodes avec leur count (0 si pas d'usage)
    return periods.map((period: any): { period: string; count: number } => ({
      period,
      count: Number(usageMap.get(period) || 0),
    }));
  }
}

export default new UsageService();

