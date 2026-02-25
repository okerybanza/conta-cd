export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountCategory = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export interface CreateAccountData {
    code: string;
    name: string;
    type: AccountType;
    category?: AccountCategory;
    parentId?: string;
    description?: string;
}
export interface UpdateAccountData extends Partial<CreateAccountData> {
    isActive?: boolean;
}
export interface AccountFilters {
    type?: AccountType;
    category?: AccountCategory;
    parentId?: string | null;
    isActive?: boolean;
    search?: string;
}
export declare class AccountService {
    /**
     * Créer un compte comptable
     */
    create(companyId: string, data: CreateAccountData): Promise<any>;
    /**
     * Obtenir un compte par ID
     */
    getById(companyId: string, accountId: string): Promise<any>;
    /**
     * Obtenir un compte par code
     */
    getByCode(companyId: string, code: string): Promise<any>;
    /**
     * Obtenir ou créer un compte par code
     * Utilisé pour les écritures automatiques (paie, etc.)
     */
    getOrCreateByCode(companyId: string, code: string, defaultName: string): Promise<any>;
    /**
     * Lister les comptes (avec hiérarchie)
     */
    list(companyId: string, filters?: AccountFilters): Promise<any>;
    /**
     * Obtenir l'arborescence complète des comptes
     */
    getTree(companyId: string, filters?: AccountFilters): Promise<any[]>;
    /**
     * Mettre à jour un compte
     */
    update(companyId: string, accountId: string, data: UpdateAccountData): Promise<any>;
    /**
     * Vérifier si un compte est un descendant d'un autre
     */
    private isDescendant;
    /**
     * Supprimer un compte
     */
    delete(companyId: string, accountId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Mettre à jour le solde d'un compte
     *
     * SPRINT 1 - TASK 1.2 (ARCH-008): DEPRECATED
     * This method directly updates the cached balance field, which can lead to data drift.
     * Balance should always be calculated from journal_entry_lines (source of truth).
     *
     * @deprecated Use BalanceValidationService.calculateBalanceFromEntries() instead
     * @throws Error - Direct balance updates are not allowed
     */
    updateBalance(accountId: string, amount: number): Promise<void>;
    /**
     * SPRINT 1 - TASK 1.2 (ARCH-008): Get Account Balance
     *
     * Calculates account balance from journal entries (source of truth).
     * Uses BalanceValidationService.calculateBalanceFromEntries() which:
     * - Filters only posted journal entries
     * - Applies correct debit/credit rules by account type
     * - Returns real-time calculated balance
     *
     * @param companyId - Company ID
     * @param accountId - Account ID
     * @param asOfDate - Optional date to calculate balance as of specific date
     * @returns Calculated balance from journal entries
     */
    getBalance(companyId: string, accountId: string, asOfDate?: Date): Promise<number>;
    /**
     * Obtenir le solde total d'un compte et de ses enfants (récursif)
     *
     * SPRINT 1 - TASK 1.2 (ARCH-008): Updated to use calculated balances
     */
    getTotalBalance(companyId: string, accountId: string): Promise<number>;
    /**
     * Rechercher des comptes par type et catégorie
     */
    findByTypeAndCategory(companyId: string, type: AccountType, category?: AccountCategory): Promise<any>;
}
declare const _default: AccountService;
export default _default;
//# sourceMappingURL=account.service.d.ts.map