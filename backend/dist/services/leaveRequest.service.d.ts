export interface CreateLeaveRequestData {
    employeeId: string;
    leaveType: string;
    startDate: Date | string;
    endDate: Date | string;
    reason?: string;
    notes?: string;
}
export interface UpdateLeaveRequestData {
    leaveType?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    reason?: string;
    notes?: string;
}
export interface LeaveRequestFilters {
    employeeId?: string;
    leaveType?: string;
    status?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    page?: number;
    limit?: number;
}
export declare class LeaveRequestService {
    /**
     * Calculer le nombre de jours entre deux dates (jours ouvrés)
     */
    private calculateDays;
    /**
     * Vérifier les chevauchements de congés
     */
    private checkOverlaps;
    /**
     * Vérifier les jours disponibles
     */
    private checkAvailableDays;
    /**
     * Créer une demande de congé
     */
    create(companyId: string, data: CreateLeaveRequestData): Promise<any>;
    /**
     * Obtenir une demande par ID
     */
    getById(companyId: string, leaveRequestId: string): Promise<any>;
    /**
     * Lister les demandes de congés
     */
    list(companyId: string, filters?: LeaveRequestFilters): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Approuver une demande de congé
     */
    approve(companyId: string, leaveRequestId: string, userId: string): Promise<any>;
    /**
     * Rejeter une demande de congé
     */
    reject(companyId: string, leaveRequestId: string, userId: string, rejectionReason?: string): Promise<any>;
    /**
     * Annuler une demande de congé
     */
    cancel(companyId: string, leaveRequestId: string, employeeId: string): Promise<any>;
    /**
     * Mettre à jour une demande de congé (seulement si pending)
     */
    update(companyId: string, leaveRequestId: string, data: UpdateLeaveRequestData): Promise<any>;
}
declare const _default: LeaveRequestService;
export default _default;
//# sourceMappingURL=leaveRequest.service.d.ts.map