export interface LeaveBalanceData {
    totalDays: number;
    usedDays: number;
    pendingDays: number;
    remainingDays: number;
    carriedForward: number;
}
export declare class LeaveBalanceService {
    /**
     * Obtenir ou créer le solde pour un employé, type et année
     */
    getOrCreateBalance(companyId: string, employeeId: string, leaveType: string, year: number): Promise<any>;
    /**
     * Obtenir le solde pour un employé, type et année
     */
    getBalance(companyId: string, employeeId: string, leaveType: string, year: number): Promise<any>;
    /**
     * Mettre à jour les jours utilisés
     */
    updateUsedDays(companyId: string, employeeId: string, leaveType: string, year: number, days: number): Promise<any>;
    /**
     * Mettre à jour les jours en attente
     */
    updatePendingDays(companyId: string, employeeId: string, leaveType: string, year: number, days: number): Promise<any>;
    /**
     * Obtenir tous les soldes d'un employé pour une année
     */
    getEmployeeBalances(companyId: string, employeeId: string, year: number): Promise<any>;
    /**
     * Initialiser les soldes pour un nouvel employé
     */
    initializeForEmployee(companyId: string, employeeId: string, hireDate: Date): Promise<void>;
    /**
     * Reporter les soldes à l'année suivante
     */
    carryForwardToNextYear(companyId: string, employeeId: string, fromYear: number): Promise<void>;
}
declare const _default: LeaveBalanceService;
export default _default;
//# sourceMappingURL=leaveBalance.service.d.ts.map