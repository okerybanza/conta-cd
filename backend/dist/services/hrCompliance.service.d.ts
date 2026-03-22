export type HrComplianceSeverity = 'info' | 'warning' | 'error';
export interface HrComplianceIssue {
    code: string;
    message: string;
    severity: HrComplianceSeverity;
    employeeId?: string;
    payrollId?: string;
    attendanceId?: string;
    leaveRequestId?: string;
    details?: Record<string, any>;
}
export interface HrComplianceSummary {
    periodStart: Date;
    periodEnd: Date;
    issues: HrComplianceIssue[];
}
export declare class HrComplianceService {
    /**
     * Valider les paies par rapport aux règles minimales RDC
     * - Salaire brut cohérent avec le salaire de base
     * - Salaire net non négatif
     * - Paies approuvées/payées dans un délai raisonnable
     */
    private checkPayrollCompliance;
    /**
     * Valider le temps de travail (présence) vs normes RDC
     * - Maximum 48 heures par semaine (8h x 6 jours) à titre indicatif
     * - Pointages avec heures négatives ou incohérentes
     */
    private checkAttendanceCompliance;
    /**
     * Vérifier la cohérence des congés par rapport aux politiques (RDC)
     * - Nombre de jours demandés vs solde disponible
     * (la logique principale est déjà dans leaveRequest/leaveBalance,
     * ici on fait surtout des rapports synthétiques).
     */
    private checkLeaveCompliance;
    /**
     * Calculer le numéro de semaine (ISO approximatif, suffisant pour contrôle RH)
     */
    private getWeekNumber;
    /**
     * Générer un rapport de conformité RH global pour une période
     */
    generateComplianceReport(companyId: string, periodStart: Date | string, periodEnd: Date | string): Promise<HrComplianceSummary>;
}
declare const _default: HrComplianceService;
export default _default;
//# sourceMappingURL=hrCompliance.service.d.ts.map