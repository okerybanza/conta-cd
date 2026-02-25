/**
 * Service de gestion de la paie (DOC-04)
 *
 * Principe clé : La paie est un résultat, pas une saisie directe
 * Elle est construite à partir :
 * - du contrat actif
 * - du temps validé
 * - des événements RH (absence, prime, sanction, bonus)
 *
 * Architecture événementielle : chaque validation génère un événement comptable
 */
export interface CreatePayrollData {
    employeeId: string;
    periodStart: Date | string;
    periodEnd: Date | string;
    payDate: Date | string;
    notes?: string;
}
export interface PayrollItemData {
    type: string;
    description: string;
    amount: number;
    isDeduction: boolean;
}
export interface CalculatePayrollResult {
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    items: PayrollItemData[];
}
export declare class PayrollService {
    /**
     * Calculer la paie à partir du contrat + temps + événements (DOC-04)
     */
    calculatePayroll(companyId: string, employeeId: string, periodStart: Date, periodEnd: Date): Promise<CalculatePayrollResult>;
    /**
     * Calculer les jours ouvrables dans une période
     */
    private calculateWorkingDays;
    /**
     * Créer une paie (DOC-04 : résultat calculé)
     */
    create(companyId: string, data: CreatePayrollData, userId?: string): Promise<any>;
    /**
     * Valider une paie (DOC-04 : immutable après validation)
     */
    validate(companyId: string, payrollId: string, userId: string): Promise<any>;
    /**
     * Annuler une paie (DOC-04 : inversion via événement)
     */
    cancel(companyId: string, payrollId: string, reason: string, userId: string): Promise<any>;
    /**
     * Supprimer une paie
     */
    delete(companyId: string, payrollId: string, userId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Obtenir une paie par ID
     */
    getById(companyId: string, payrollId: string): Promise<any>;
    /**
     * Lister les paies avec pagination et filtres
     */
    list(companyId: string, filters?: {
        employeeId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Lister les paies d'un employé
     */
    listByEmployee(companyId: string, employeeId: string): Promise<any>;
    /**
     * Mettre à jour une paie (uniquement si draft)
     */
    update(companyId: string, payrollId: string, data: {
        status?: string;
        paymentMethod?: string;
        paymentReference?: string;
        paidAt?: string;
        paidBy?: string;
        notes?: string;
    }, userId?: string): Promise<any>;
    /**
     * Approuver une paie (changer de draft à approved)
     */
    approve(companyId: string, payrollId: string, userId: string): Promise<any>;
    /**
     * Marquer une paie comme payée
     */
    markAsPaid(companyId: string, payrollId: string, data: {
        paymentMethod?: string;
        paymentReference?: string;
        paidAt?: string;
    }, userId: string): Promise<any>;
}
declare const _default: PayrollService;
export default _default;
//# sourceMappingURL=payroll.service.d.ts.map