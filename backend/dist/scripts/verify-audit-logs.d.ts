/**
 * SPRINT 2 - TASK 2.1 (ACCT-012): Verify Audit Log Integrity
 *
 * This script checks the entire hash chain of the audit logs to detect any tampering
 */
export declare function verifyAuditLogIntegrity(): Promise<{
    success: boolean;
    message: string;
    tamperedLogs?: undefined;
} | {
    success: boolean;
    tamperedLogs: string[];
    message?: undefined;
}>;
//# sourceMappingURL=verify-audit-logs.d.ts.map