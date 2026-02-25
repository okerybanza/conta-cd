/**
 * DOC-10 : Messages d'erreur explicites avec solutions
 *
 * Principe : Avant toute action bloquante :
 * - Expliquer pourquoi
 * - Indiquer quoi faire à la place
 *
 * Un refus sans explication est une mauvaise UX.
 */
export interface ErrorWithSolution {
    message: string;
    code: string;
    solution: string;
    details?: any;
}
/**
 * Messages d'erreur avec solutions selon DOC-10
 */
export declare const ErrorMessages: {
    /**
     * Période clôturée
     */
    PERIOD_CLOSED: (periodName?: string) => ErrorWithSolution;
    /**
     * Période verrouillée
     */
    PERIOD_LOCKED: (periodName?: string) => ErrorWithSolution;
    /**
     * Période non trouvée
     */
    PERIOD_NOT_FOUND: (date?: string) => ErrorWithSolution;
    /**
     * Facture validée (non modifiable)
     */
    INVOICE_VALIDATED: (invoiceNumber?: string) => ErrorWithSolution;
    /**
     * Stock insuffisant
     */
    INSUFFICIENT_STOCK: (productName?: string, available?: number, requested?: number) => ErrorWithSolution;
    /**
     * Stock négatif interdit
     */
    NEGATIVE_STOCK_NOT_ALLOWED: (productName?: string) => ErrorWithSolution;
    /**
     * Paie validée (non modifiable)
     */
    PAYROLL_VALIDATED: (payrollId?: string) => ErrorWithSolution;
    /**
     * Mouvement de stock validé (non modifiable)
     */
    STOCK_MOVEMENT_VALIDATED: (movementId?: string) => ErrorWithSolution;
    /**
     * Module non activé
     */
    MODULE_NOT_ACTIVATED: (moduleName: string) => ErrorWithSolution;
    /**
     * Datarissage incomplet
     */
    DATARISSAGE_INCOMPLETE: (step?: number) => ErrorWithSolution;
    /**
     * Permission insuffisante
     */
    INSUFFICIENT_PERMISSION: (action: string, requiredRole?: string) => ErrorWithSolution;
    /**
     * Justification manquante
     */
    JUSTIFICATION_REQUIRED: (action: string) => ErrorWithSolution;
    /**
     * Email non trouvé
     */
    EMAIL_NOT_FOUND: () => ErrorWithSolution;
    /**
     * Identifiants invalides
     */
    INVALID_CREDENTIALS: () => ErrorWithSolution;
    /**
     * Compte verrouillé
     */
    ACCOUNT_LOCKED: (minutesLeft?: number) => ErrorWithSolution;
    /**
     * Code 2FA requis
     */
    '2FA_REQUIRED': () => ErrorWithSolution;
    /**
     * Code 2FA invalide
     */
    INVALID_2FA_CODE: () => ErrorWithSolution;
    EMAIL_NOT_VERIFIED: () => ErrorWithSolution;
    EMAIL_VERIFICATION_REQUIRED: () => ErrorWithSolution;
    EMAIL_VERIFICATION_CODE_INVALID: () => ErrorWithSolution;
    EMAIL_VERIFICATION_CODE_EXPIRED: () => ErrorWithSolution;
};
/**
 * Créer une erreur avec solution depuis un code d'erreur
 */
export declare function createErrorWithSolution(code: string, ...args: any[]): ErrorWithSolution;
//# sourceMappingURL=error-messages.d.ts.map