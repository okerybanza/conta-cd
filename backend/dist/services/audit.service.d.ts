export interface AuditLogData {
    companyId?: string;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    entityType: string;
    entityId?: string;
    module?: string;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
    changes?: Record<string, any>;
    justification?: string;
    reason?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuditService {
    /**
     * Actions requiring mandatory justification (DOC-08)
     */
    private readonly ACTIONS_REQUIRING_JUSTIFICATION;
    /**
     * Validate justification for critical actions (DOC-08)
     */
    private validateJustification;
    createLog(data: AuditLogData): Promise<any>;
    logCreate(companyId: string | undefined, userId: string | undefined, userEmail: string | undefined, userRole: string | undefined, // DOC-08
    entityType: string, entityId: string, data: Record<string, any>, module?: string, // DOC-08
    justification?: string, // DOC-08
    ipAddress?: string, userAgent?: string): Promise<any>;
    logUpdate(companyId: string | undefined, userId: string | undefined, userEmail: string | undefined, userRole: string | undefined, // DOC-08
    entityType: string, entityId: string, oldData: Record<string, any>, newData: Record<string, any>, module?: string, // DOC-08
    justification?: string, // DOC-08
    ipAddress?: string, userAgent?: string): Promise<any>;
    logDelete(companyId: string | undefined, userId: string | undefined, userEmail: string | undefined, userRole: string | undefined, // DOC-08
    entityType: string, entityId: string, data: Record<string, any>, module?: string, // DOC-08
    justification?: string, // DOC-08 (mandatory for DELETE)
    ipAddress?: string, userAgent?: string): Promise<any>;
    logRead(companyId: string | undefined, userId: string | undefined, userEmail: string | undefined, entityType: string, entityId: string, ipAddress?: string, userAgent?: string): Promise<any>;
    logCustom(companyId: string | undefined, userId: string | undefined, userEmail: string | undefined, action: string, entityType: string, entityId: string | undefined, metadata?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<any>;
    getLogs(companyId?: string, filters?: {
        userId?: string;
        action?: string;
        entityType?: string;
        entityId?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        logs: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * SPRINT 2 - TASK 2.1: Verify audit log integrity
     */
    verifyIntegrity(): Promise<{
        success: boolean;
        message: string;
        tamperedLogs?: undefined;
    } | {
        success: boolean;
        tamperedLogs: string[];
        message?: undefined;
    }>;
}
declare const _default: AuditService;
export default _default;
//# sourceMappingURL=audit.service.d.ts.map