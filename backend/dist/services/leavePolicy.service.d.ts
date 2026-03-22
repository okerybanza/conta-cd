export interface CreateLeavePolicyData {
    name: string;
    leaveType: string;
    daysPerYear: number;
    daysPerMonth?: number;
    maxAccumulation?: number;
    carryForward?: boolean;
    requiresApproval?: boolean;
    minNoticeDays?: number;
    description?: string;
}
export interface UpdateLeavePolicyData {
    name?: string;
    daysPerYear?: number;
    daysPerMonth?: number;
    maxAccumulation?: number;
    carryForward?: boolean;
    requiresApproval?: boolean;
    minNoticeDays?: number;
    isActive?: boolean;
    description?: string;
}
export interface LeavePolicyFilters {
    leaveType?: string;
    isActive?: boolean;
}
export declare class LeavePolicyService {
    /**
     * Créer une politique de congés
     */
    create(companyId: string, data: CreateLeavePolicyData): Promise<any>;
    /**
     * Obtenir une politique par ID
     */
    getById(companyId: string, policyId: string): Promise<any>;
    /**
     * Obtenir une politique par type
     */
    getByType(companyId: string, leaveType: string): Promise<any>;
    /**
     * Lister les politiques de congés
     */
    list(companyId: string, filters?: LeavePolicyFilters): Promise<{
        data: any;
        total: any;
    }>;
    /**
     * Mettre à jour une politique
     */
    update(companyId: string, policyId: string, data: UpdateLeavePolicyData): Promise<any>;
    /**
     * Supprimer une politique
     */
    delete(companyId: string, policyId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Créer les politiques par défaut pour RDC
     */
    createDefaultPolicies(companyId: string): Promise<any[]>;
}
declare const _default: LeavePolicyService;
export default _default;
//# sourceMappingURL=leavePolicy.service.d.ts.map