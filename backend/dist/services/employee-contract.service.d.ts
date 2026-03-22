/**
 * Service de gestion des contrats RH (DOC-04)
 *
 * Principe : Un employé peut avoir plusieurs contrats successifs, jamais simultanés actifs
 * Architecture événementielle : chaque action génère un événement
 */
export interface CreateEmployeeContractData {
    employeeId: string;
    contractType: 'CDI' | 'CDD' | 'journalier' | 'consultant';
    startDate: Date | string;
    endDate?: Date | string;
    baseSalary: number;
    currency?: string;
    workType?: 'full_time' | 'part_time';
    hoursPerWeek?: number;
    notes?: string;
}
export interface UpdateEmployeeContractData {
    endDate?: Date | string;
    baseSalary?: number;
    workType?: 'full_time' | 'part_time';
    hoursPerWeek?: number;
    notes?: string;
}
export declare class EmployeeContractService {
    /**
     * Créer un contrat RH (DOC-04)
     * Invariant : un employé actif doit avoir un contrat actif
     * Invariant : jamais de contrats simultanés actifs
     */
    create(companyId: string, data: CreateEmployeeContractData, userId?: string): Promise<any>;
    /**
     * Obtenir un contrat par ID
     */
    getById(companyId: string, contractId: string): Promise<any>;
    /**
     * Obtenir le contrat actif d'un employé
     */
    getActiveContract(companyId: string, employeeId: string): Promise<any>;
    /**
     * Lister les contrats d'un employé
     */
    listByEmployee(companyId: string, employeeId: string): Promise<any>;
    /**
     * Mettre à jour un contrat
     */
    update(companyId: string, contractId: string, data: UpdateEmployeeContractData, userId?: string): Promise<any>;
    /**
     * Terminer un contrat (DOC-04 : immutabilité)
     */
    terminate(companyId: string, contractId: string, reason?: string, userId?: string): Promise<any>;
}
declare const _default: EmployeeContractService;
export default _default;
//# sourceMappingURL=employee-contract.service.d.ts.map