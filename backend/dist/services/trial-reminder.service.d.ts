export interface TrialReminderData {
    daysRemaining: number;
    trialEndDate: Date;
    packageName: string;
    amount: string;
    currency: string;
    billingCycle: string;
    subscriptionUrl: string;
    supportEmail: string;
}
/**
 * Service pour gérer les rappels de fin d'essai
 */
export declare class TrialReminderService {
    /**
     * Envoyer un email de rappel pour un essai qui se termine
     */
    sendTrialReminder(userId: string, userEmail: string, firstName: string, companyName: string, data: TrialReminderData): Promise<{
        success: boolean;
    }>;
    /**
     * Traiter tous les rappels d'essai à envoyer aujourd'hui
     * À appeler par un cron job quotidien
     */
    processTrialReminders(): Promise<{
        subscriptionId: string;
        companyId: string;
        daysRemaining: number;
        emailsSent: number;
        success: boolean;
    }[]>;
    /**
     * Trouver les abonnements en essai qui se terminent à une date donnée
     */
    private findTrialsEndingOn;
    /**
     * Envoyer les rappels pour un abonnement spécifique
     */
    private sendReminderForSubscription;
}
declare const _default: TrialReminderService;
export default _default;
//# sourceMappingURL=trial-reminder.service.d.ts.map