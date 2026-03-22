export interface CreateSubscriptionPaymentData {
    subscriptionId: string;
    amount: number;
    currency?: string;
    paymentMethod: string;
    paymentDate: Date;
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
export declare class SubscriptionPaymentService {
    /**
     * Enregistrer un paiement d'abonnement
     */
    recordPayment(subscriptionId: string, data: CreateSubscriptionPaymentData, adminUserId: string): Promise<any>;
    /**
     * Obtenir tous les abonnements avec leur statut de paiement
     */
    getAllSubscriptionsWithPaymentStatus(filters?: {
        status?: string;
        paymentOverdue?: boolean;
        companyId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        subscriptions: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Obtenir les statistiques de paiement
     */
    getPaymentStatistics(): Promise<{
        activeSubscriptions: any;
        overdueSubscriptions: any;
        expiringThisMonth: any;
        monthlyRevenue: any;
        yearlyRevenue: any;
        statusDistribution: any;
        billingCycleDistribution: any;
    }>;
    /**
     * Obtenir l'historique des paiements d'un abonnement
     */
    getPaymentHistory(subscriptionId: string): Promise<{
        subscription: any;
        history: {
            id: string;
            date: any;
            amount: number;
            currency: any;
            paymentMethod: any;
            status: string;
        }[];
    }>;
}
declare const _default: SubscriptionPaymentService;
export default _default;
//# sourceMappingURL=subscription-payment.service.d.ts.map