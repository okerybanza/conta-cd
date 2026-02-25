export interface CreateApprovalRuleData {
    name: string;
    description?: string;
    enabled?: boolean;
    amountThreshold?: number | null;
    categoryId?: string | null;
    requireJustificatif?: boolean;
    approvers: string[];
}
export interface UpdateApprovalRuleData extends Partial<CreateApprovalRuleData> {
}
export declare class ExpenseApprovalRuleService {
    /**
     * Créer une règle d'approbation
     */
    create(companyId: string, data: CreateApprovalRuleData): Promise<any>;
    /**
     * Lister les règles d'approbation d'une entreprise
     */
    list(companyId: string, includeDisabled?: boolean): Promise<any>;
    /**
     * Obtenir une règle par ID
     */
    getById(companyId: string, ruleId: string): Promise<any>;
    /**
     * Mettre à jour une règle
     */
    update(companyId: string, ruleId: string, data: UpdateApprovalRuleData): Promise<any>;
    /**
     * Supprimer une règle
     */
    delete(companyId: string, ruleId: string): Promise<void>;
    /**
     * Trouver les règles applicables pour une dépense
     */
    findApplicableRules(companyId: string, amountTtc: number, categoryId?: string | null): Promise<any>;
    /**
     * Vérifier si une dépense nécessite une approbation
     */
    requiresApproval(companyId: string, amountTtc: number, categoryId?: string | null, hasJustificatif?: boolean): Promise<{
        requires: boolean;
        ruleId?: string;
        approvers?: string[];
    }>;
}
declare const _default: ExpenseApprovalRuleService;
export default _default;
//# sourceMappingURL=expenseApprovalRule.service.d.ts.map