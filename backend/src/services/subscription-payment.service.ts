import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export interface CreateSubscriptionPaymentData {
  subscriptionId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paymentDate?: Date;
  transactionReference?: string;
  notes?: string;
}

export interface SubscriptionPaymentFilters {
  companyId?: string;
  subscriptionId?: string;
  status?: string;
  paymentMethod?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class SubscriptionPaymentService {
  /**
   * Enregistrer un paiement d'abonnement
   */
  async recordPayment(
    subscriptionId: string,
    data: CreateSubscriptionPaymentData,
    adminUserId: string
  ) {
    // Vérifier que l'abonnement existe
    const subscription = await prisma.subscriptions.findUnique({
      where: { id: subscriptionId },
      include: {
        packages: true,
        companies: true,
      },
    });

    if (!subscription) {
      throw new CustomError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    // Calculer la date de fin selon le cycle de facturation
    const paymentDate = new Date(data.paymentDate);
    const newEndDate = new Date(paymentDate);
    
    if (subscription.billing_cycle === 'yearly') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    }

    // Mettre à jour l'abonnement
    const updated = await prisma.subscriptions.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        last_payment_date: paymentDate,
        next_payment_date: newEndDate,
        end_date: newEndDate,
        payment_method: data.paymentMethod,
      },
      include: {
        packages: true,
        companies: true,
      },
    });

    // Créer un log de paiement (on pourrait créer une table dédiée plus tard)
    // Pour l'instant, on utilise les logs d'audit
    logger.info('Subscription payment recorded', {
      subscriptionId,
      companyId: subscription.company_id,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      adminUserId,
    });

    return updated;
  }

  /**
   * Obtenir tous les abonnements avec leur statut de paiement
   */
  async getAllSubscriptionsWithPaymentStatus(filters?: {
    status?: string;
    paymentOverdue?: boolean;
    companyId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.companyId) {
      where.company_id = filters.companyId;
    }

    // Filtrer les abonnements en retard de paiement
    if (filters?.paymentOverdue) {
      where.next_payment_date = {
        lt: new Date(),
      };
      where.status = 'active';
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscriptions.findMany({
        where,
        skip,
        take: limit,
        include: {
          packages: true,
          companies: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.subscriptions.count({ where }),
    ]);

    // Enrichir avec le statut de paiement
    const enriched = subscriptions.map((sub) => {
      const isOverdue = sub.next_payment_date
        ? new Date(sub.next_payment_date) < new Date() && sub.status === 'active'
        : false;
      const daysUntilPayment = sub.next_payment_date
        ? Math.ceil(
            (new Date(sub.next_payment_date).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        ...sub,
        paymentStatus: {
          isOverdue,
          daysUntilPayment,
          lastPaymentDate: sub.last_payment_date,
          nextPaymentDate: sub.next_payment_date,
          paymentMethod: sub.payment_method,
        },
      };
    });

    return {
      subscriptions: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir les statistiques de paiement
   */
  async getPaymentStatistics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Total des abonnements actifs
    const activeSubscriptions = await prisma.subscriptions.count({
      where: {
        status: 'active',
      },
    });

    // Abonnements en retard de paiement
    const overdueSubscriptions = await prisma.subscriptions.count({
      where: {
        status: 'active',
        next_payment_date: {
          lt: now,
        },
      },
    });

    // Abonnements expirant ce mois
    const expiringThisMonth = await prisma.subscriptions.count({
      where: {
        status: 'active',
        end_date: {
          gte: startOfMonth,
          lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        },
      },
    });

    // Revenus mensuels estimés (somme des prix des abonnements actifs)
    const activeSubsWithPackage = await prisma.subscriptions.findMany({
      where: {
        status: 'active',
      },
      include: {
        packages: true,
      },
    });

    const monthlyRevenue = activeSubsWithPackage.reduce((sum, sub) => {
      const price = Number(sub.packages.price);
      return sum + (sub.billing_cycle === 'monthly' ? price : price / 12);
    }, 0);

    const yearlyRevenue = activeSubsWithPackage.reduce((sum, sub) => {
      const price = Number(sub.packages.price);
      return sum + (sub.billing_cycle === 'yearly' ? price : price * 12);
    }, 0);

    // Répartition par statut
    const statusDistribution = await prisma.subscriptions.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // Répartition par cycle de facturation
    const billingCycleDistribution = await prisma.subscriptions.groupBy({
      by: ['billing_cycle'],
      _count: {
        id: true,
      },
    });

    return {
      activeSubscriptions,
      overdueSubscriptions,
      expiringThisMonth,
      monthlyRevenue,
      yearlyRevenue,
      statusDistribution: statusDistribution.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      billingCycleDistribution: billingCycleDistribution.map((b) => ({
        billingCycle: b.billing_cycle,
        count: b._count.id,
      })),
    };
  }

  /**
   * Obtenir l'historique des paiements d'un abonnement
   */
  async getPaymentHistory(subscriptionId: string) {
    const subscription = await prisma.subscriptions.findUnique({
      where: { id: subscriptionId },
      include: {
        packages: true,
        companies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new CustomError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    // Pour l'instant, on retourne les informations de l'abonnement
    // Plus tard, on pourrait créer une table dédiée pour l'historique des paiements
    const history = [];

    if (subscription.last_payment_date) {
      history.push({
        id: `payment-${subscription.id}-${subscription.last_payment_date.getTime()}`,
        date: subscription.last_payment_date,
        amount: Number(subscription.packages.price),
        currency: subscription.packages.currency || 'USD',
        paymentMethod: subscription.payment_method,
        status: 'confirmed',
      });
    }

    return {
      subscription,
      history,
    };
  }
}

export default new SubscriptionPaymentService();
