export type BusinessType = 'commerce' | 'services' | 'production' | 'logistique' | 'ong' | 'multi_activite';
export type StockManagementType = 'simple' | 'multi_warehouses';
export type StockTrackingType = 'quantity' | 'lots' | 'serial_numbers';
export type StockValuationMethod = 'fifo' | 'weighted_average';
export type RhOrganizationType = 'simple' | 'departmental' | 'multi_entity';
export type PayrollCycle = 'monthly' | 'other';
export interface DatarissageStep1Data {
    raisonSociale: string;
    pays: string;
    devise: string;
    timezone: string;
    typeActivite: string;
}
export interface DatarissageStep2Data {
    businessType: BusinessType;
}
export interface DatarissageStep3Data {
    moduleFacturation: boolean;
    moduleComptabilite: boolean;
    moduleStock: boolean;
    moduleRh: boolean;
}
export interface DatarissageStep4Data {
    stockManagementType: StockManagementType;
    stockTrackingType: StockTrackingType;
    stockAllowNegative: boolean;
    stockValuationMethod: StockValuationMethod;
}
export interface DatarissageStep5Data {
    rhOrganizationType: RhOrganizationType;
    rhPayrollEnabled: boolean;
    rhPayrollCycle: PayrollCycle;
    rhAccountingIntegration: boolean;
}
export interface DatarissageStep6Data {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
export interface DatarissageCompleteData {
    step1: DatarissageStep1Data;
    step2: DatarissageStep2Data;
    step3: DatarissageStep3Data;
    step4?: DatarissageStep4Data;
    step5?: DatarissageStep5Data;
    step6: DatarissageStep6Data;
}
export declare class DatarissageService {
    /**
     * Vérifier si le datarissage est déjà complété
     */
    isCompleted(companyId: string): Promise<boolean>;
    /**
     * Valider les données d'une étape
     */
    private validateStep1;
    private validateStep2;
    private validateStep3;
    private validateStep4;
    private validateStep5;
    private validateStep6;
    /**
     * Compléter le datarissage (toutes les étapes)
     */
    completeDatarissage(companyId: string, data: DatarissageCompleteData, userId?: string): Promise<any>;
    /**
     * Obtenir l'état actuel du datarissage
     */
    getDatarissageStatus(companyId: string): Promise<any>;
    /**
     * Vérifier si un élément est verrouillé
     */
    isFieldLocked(companyId: string, field: string): Promise<boolean>;
}
declare const _default: DatarissageService;
export default _default;
//# sourceMappingURL=datarissage.service.d.ts.map