export interface CreateSubscriptionData {
    packageId: string;
    billingCycle: 'monthly' | 'yearly';
    startDate?: Date;
    trialDays?: number;
}
export declare class SubscriptionService {
    /**
     * Calculer les dates et le statut pour un nouveau plan.
     */
    private computePlanData;
    /**
     * Charger le package attaché à un abonnement (fallback si le include Prisma a échoué).
     */
    private ensurePackageLoaded;
    /**
     * Obtenir l'abonnement d'une entreprise (quel que soit son statut).
     * Applique les transitions automatiques :
     *   trial  → expired  si trial_ends_at dépassé
     *   active → expired  si end_date dépassé
     *
     * Retourne TOUJOURS l'abonnement s'il existe, même s'il est expiré.
     * Lance SUBSCRIPTION_NOT_FOUND uniquement si aucun enregistrement n'existe.
     */
    getActive(companyId: string): Promise<any>;
    /**
     * Vérifier si une entreprise est en période d'essai valide.
     */
    isTrial(companyId: string): Promise<boolean>;
    /**
     * Créer ou réactiver un abonnement pour une entreprise.
     *
     * Logique :
     * - Si aucun abonnement → créer un nouveau
     * - Si abonnement active/trial → erreur SUBSCRIPTION_EXISTS
     * - Si abonnement expired/cancelled → mettre à jour l'existant (réactiver)
     */
    create(companyId: string, data: CreateSubscriptionData): Promise<any>;
    /**
     * Changer de package.
     * Réinitialise les dates et le statut (trial pour payant, active pour gratuit).
     */
    upgrade(companyId: string, newPackageId: string, userId?: string): Promise<any>;
    /**
     * Envoi asynchrone des emails d'upgrade (ne bloque pas la réponse).
     */
    private sendUpgradeEmails;
    /**
     * Annuler un abonnement (actif ou trial uniquement).
     */
    cancel(companyId: string, userId?: string): Promise<any>;
    /**
     * Renouveler un abonnement (manuellement ou automatiquement).
     * Fonctionne pour les abonnements expired, cancelled, ou actifs arrivant à expiration.
     * Utilise findUnique directement (ne dépend PAS de getActive()).
     */
    renew(companyId: string, automatic?: boolean): Promise<any>;
    /**
     * Envoi asynchrone des emails de renouvellement.
     */
    private sendRenewalEmails;
    /**
     * Expirer les essais dont trial_ends_at est dépassé.
     * À appeler par un cron job quotidien.
     */
    expireTrials(): Promise<{
        expired: any;
    }>;
    /**
     * Expirer les abonnements actifs dont end_date est dépassé.
     * À appeler par un cron job quotidien.
     */
    expireSubscriptions(): Promise<{
        expired: any;
    }>;
    /**
     * Obtenir le package actif d'une entreprise.
     */
    getActivePackage(companyId: string): Promise<any>;
}
declare const _default: SubscriptionService;
export default _default;
//# sourceMappingURL=subscription.service.d.ts.map