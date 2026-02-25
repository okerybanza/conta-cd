export interface DeleteAccountOptions {
    reason?: string;
    anonymizeImmediately?: boolean;
}
export interface RestoreAccountResult {
    success: boolean;
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
    };
    restoredAt: Date;
}
export declare class AccountDeletionService {
    /**
     * Supprimer un compte utilisateur (soft delete avec période de grâce)
     *
     * @param userId ID de l'utilisateur à supprimer
     * @param deleterId ID de l'utilisateur qui effectue la suppression
     * @param options Options de suppression
     */
    deleteAccount(userId: string, deleterId: string, options?: DeleteAccountOptions): Promise<{
        success: boolean;
        userId: any;
        originalEmail: any;
        gracePeriodEnd: Date;
        canRestore: boolean;
        message: string;
    }>;
    /**
     * Restaurer un compte supprimé (pendant la période de grâce)
     *
     * @param email Email original du compte à restaurer
     * @param newPassword Nouveau mot de passe (optionnel, si non fourni, envoi d'un lien de réinitialisation)
     */
    restoreAccount(email: string, newPassword?: string): Promise<RestoreAccountResult>;
    /**
     * Vérifier si un email peut être réutilisé (pour l'inscription)
     *
     * @param email Email à vérifier
     * @returns true si l'email peut être réutilisé, false sinon
     */
    canReuseEmail(email: string): Promise<{
        canReuse: boolean;
        reason?: string;
        gracePeriodEnd?: Date;
    }>;
    /**
     * Nettoyer les comptes supprimés après la période d'anonymisation
     * (À exécuter via un cron job quotidien)
     */
    cleanupAnonymizedAccounts(): Promise<{
        total: any;
        anonymized: number;
        errors: number;
    }>;
    /**
     * Obtenir les informations sur un compte supprimé (pour l'utilisateur)
     */
    getDeletedAccountInfo(email: string): Promise<{
        found: boolean;
        deletedAt: Date;
        gracePeriodEnd: Date;
        canRestore: any;
        daysRemaining: number;
        anonymized: any;
    } | {
        found: boolean;
        deletedAt?: undefined;
        gracePeriodEnd?: undefined;
        canRestore?: undefined;
        daysRemaining?: undefined;
        anonymized?: undefined;
    }>;
}
declare const _default: AccountDeletionService;
export default _default;
//# sourceMappingURL=account-deletion.service.d.ts.map