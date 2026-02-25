"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPaymentService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
class SubscriptionPaymentService {
    /**
     * Enregistrer un paiement d'abonnement
     */
    async recordPayment(subscriptionId, data, adminUserId) {
        // Vérifier que l'abonnement existe
        const subscription = await database_1.default.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                package: true,
                company: true,
            },
        });
        if (!subscription) {
            throw new error_middleware_1.CustomError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
        }
        // Calculer la date de fin selon le cycle de facturation
        const paymentDate = new Date(data.paymentDate);
        const newEndDate = new Date(paymentDate);
        if (subscription.billingCycle === 'yearly') {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        }
        else {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
        }
        // Mettre à jour l'abonnement
        const updated = await database_1.default.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'active',
                lastPaymentDate: paymentDate,
                nextPaymentDate: newEndDate,
                endDate: newEndDate,
                paymentMethod: data.paymentMethod,
            },
            include: {
                package: true,
                company: true,
            },
        });
        // Créer un log de paiement (on pourrait créer une table dédiée plus tard)
        // Pour l'instant, on utilise les logs d'audit
        logger_1.default.info('Subscription payment recorded', {
            subscriptionId,
            companyId: subscription.companyId,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            adminUserId,
        });
        return updated;
    }
    /**
     * Obtenir tous les abonnements avec leur statut de paiement
     */
    async getAllSubscriptionsWithPaymentStatus(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.companyId) {
            where.companyId = filters.companyId;
        }
        // Filtrer les abonnements en retard de paiement
        if (filters?.paymentOverdue) {
            where.nextPaymentDate = {
                lt: new Date(),
            };
            where.status = 'active';
        }
        const [subscriptions, total] = await Promise.all([
            database_1.default.subscription.findMany({
                where,
                skip,
                take: limit,
                include: {
                    package: true,
                    company: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.default.subscription.count({ where }),
        ]);
        // Enrichir avec le statut de paiement
        const enriched = subscriptions.map((sub) => {
            const isOverdue = sub.nextPaymentDate
                ? new Date(sub.nextPaymentDate) < new Date() && sub.status === 'active'
                : false;
            const daysUntilPayment = sub.nextPaymentDate
                ? Math.ceil((new Date(sub.nextPaymentDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24))
                : null;
            return {
                ...sub,
                paymentStatus: {
                    isOverdue,
                    daysUntilPayment,
                    lastPaymentDate: sub.lastPaymentDate,
                    nextPaymentDate: sub.nextPaymentDate,
                    paymentMethod: sub.paymentMethod,
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
        const activeSubscriptions = await database_1.default.subscription.count({
            where: {
                status: 'active',
            },
        });
        // Abonnements en retard de paiement
        const overdueSubscriptions = await database_1.default.subscription.count({
            where: {
                status: 'active',
                nextPaymentDate: {
                    lt: now,
                },
            },
        });
        // Abonnements expirant ce mois
        const expiringThisMonth = await database_1.default.subscription.count({
            where: {
                status: 'active',
                endDate: {
                    gte: startOfMonth,
                    lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
                },
            },
        });
        // Revenus mensuels estimés (somme des prix des abonnements actifs)
        const activeSubsWithPackage = await database_1.default.subscription.findMany({
            where: {
                status: 'active',
            },
            include: {
                package: true,
            },
        });
        const monthlyRevenue = activeSubsWithPackage.reduce((sum, sub) => {
            const price = Number(sub.package.price);
            return sum + (sub.billingCycle === 'monthly' ? price : price / 12);
        }, 0);
        const yearlyRevenue = activeSubsWithPackage.reduce((sum, sub) => {
            const price = Number(sub.package.price);
            return sum + (sub.billingCycle === 'yearly' ? price : price * 12);
        }, 0);
        // Répartition par statut
        const statusDistribution = await database_1.default.subscription.groupBy({
            by: ['status'],
            _count: {
                id: true,
            },
        });
        // Répartition par cycle de facturation
        const billingCycleDistribution = await database_1.default.subscription.groupBy({
            by: ['billingCycle'],
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
                billingCycle: b.billingCycle,
                count: b._count.id,
            })),
        };
    }
    /**
     * Obtenir l'historique des paiements d'un abonnement
     */
    async getPaymentHistory(subscriptionId) {
        const subscription = await database_1.default.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                package: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!subscription) {
            throw new error_middleware_1.CustomError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
        }
        // Pour l'instant, on retourne les informations de l'abonnement
        // Plus tard, on pourrait créer une table dédiée pour l'historique des paiements
        const history = [];
        if (subscription.lastPaymentDate) {
            history.push({
                id: `payment-${subscription.id}-${subscription.lastPaymentDate.getTime()}`,
                date: subscription.lastPaymentDate,
                amount: Number(subscription.package.price),
                currency: subscription.package.currency || 'USD',
                paymentMethod: subscription.paymentMethod,
                status: 'confirmed',
            });
        }
        return {
            subscription,
            history,
        };
    }
}
exports.SubscriptionPaymentService = SubscriptionPaymentService;
exports.default = new SubscriptionPaymentService();
//# sourceMappingURL=subscription-payment.service.js.map