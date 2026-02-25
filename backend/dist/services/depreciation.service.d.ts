export type DepreciationMethod = 'linear' | 'declining';
export interface CreateDepreciationData {
    assetAccountId: string;
    depreciationAccountId: string;
    assetName: string;
    acquisitionDate: string | Date;
    acquisitionCost: number;
    depreciationMethod: DepreciationMethod;
    depreciationRate?: number;
    usefulLife: number;
    notes?: string;
}
export interface UpdateDepreciationData {
    assetName?: string;
    depreciationMethod?: DepreciationMethod;
    depreciationRate?: number;
    usefulLife?: number;
    isActive?: boolean;
    notes?: string;
}
export interface DepreciationTableEntry {
    period: string;
    date: Date;
    monthlyDepreciation: number;
    accumulatedDepreciation: number;
    netBookValue: number;
}
export declare class DepreciationService {
    /**
     * Calculer l'amortissement accumulé à partir des écritures comptables
     */
    private calculateAccumulatedDepreciation;
    /**
     * Calculer l'amortissement mensuel (linéaire)
     */
    private calculateLinearMonthlyDepreciation;
    /**
     * Calculer l'amortissement mensuel (dégressif)
     */
    private calculateDecliningMonthlyDepreciation;
    /**
     * Créer un plan d'amortissement
     */
    create(companyId: string, data: CreateDepreciationData, userId?: string): Promise<any>;
    /**
     * Obtenir un plan d'amortissement par ID
     */
    getById(companyId: string, depreciationId: string): Promise<any>;
    /**
     * Lister les plans d'amortissement
     */
    list(companyId: string, filters?: {
        isActive?: boolean;
    }): Promise<any>;
    /**
     * Mettre à jour un plan d'amortissement
     */
    update(companyId: string, depreciationId: string, data: UpdateDepreciationData): Promise<any>;
    /**
     * Calculer l'amortissement mensuel actuel
     */
    calculateMonthlyDepreciation(companyId: string, depreciationId: string): Promise<number>;
    /**
     * Générer une écriture d'amortissement pour un mois donné
     */
    generateDepreciationEntry(companyId: string, depreciationId: string, period: string, // Format: "2025-01"
    userId?: string): Promise<any>;
    /**
     * Générer le tableau d'amortissement complet
     */
    generateDepreciationTable(companyId: string, depreciationId: string): Promise<DepreciationTableEntry[]>;
    /**
     * Supprimer un plan d'amortissement
     */
    delete(companyId: string, depreciationId: string): Promise<void>;
    /**
     * Traiter tous les amortissements actifs pour générer les écritures du mois précédent
     * Cette méthode est appelée par le scheduler mensuel
     */
    processMonthlyDepreciations(): Promise<Array<{
        depreciationId: string;
        companyId: string;
        entryId?: string;
        success: boolean;
        skipped?: boolean;
        error?: string;
        reason?: string;
    }>>;
}
declare const _default: DepreciationService;
export default _default;
//# sourceMappingURL=depreciation.service.d.ts.map