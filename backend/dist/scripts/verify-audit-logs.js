"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuditLogIntegrity = verifyAuditLogIntegrity;
const database_1 = __importDefault(require("../config/database"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * SPRINT 2 - TASK 2.1 (ACCT-012): Verify Audit Log Integrity
 *
 * This script checks the entire hash chain of the audit logs to detect any tampering
 */
async function verifyAuditLogIntegrity() {
    logger_1.default.info('Starting audit log integrity verification...');
    try {
        const logs = await database_1.default.audit_logs.findMany({
            orderBy: { created_at: 'asc' },
        });
        let isValid = true;
        let tamperedLogs = [];
        let currentPreviousHash = '0'.repeat(64);
        for (const log of logs) {
            // 1. Check if previous_hash matches the expected chain
            if (log.previous_hash !== currentPreviousHash) {
                isValid = false;
                tamperedLogs.push(log.id);
                logger_1.default.error(`Chain broken at log ID: ${log.id}. Expected previous hash: ${currentPreviousHash}, Found: ${log.previous_hash}`);
            }
            // 2. Re-calculate the hash and compare it
            const logContent = {
                companyId: log.company_id || undefined,
                userId: log.user_id || undefined,
                action: log.action,
                entityType: log.entity,
                entityId: log.entity_id || undefined,
                module: log.module || undefined,
                beforeState: log.before_state || undefined,
                afterState: log.after_state || undefined,
                justification: log.justification || undefined,
                reason: log.reason || undefined,
                previousHash: log.previous_hash,
                timestamp: log.created_at.toISOString(),
            };
            const calculatedHash = crypto_1.default
                .createHash('sha256')
                .update(JSON.stringify(logContent))
                .digest('hex');
            if (log.hash !== calculatedHash) {
                isValid = false;
                tamperedLogs.push(log.id);
                logger_1.default.error(`Hash mismatch at log ID: ${log.id}. Calculated: ${calculatedHash}, Stored: ${log.hash}`);
            }
            currentPreviousHash = log.hash || '';
        }
        if (isValid) {
            logger_1.default.info('Audit log integrity verification successful! All logs are valid.');
            return { success: true, message: 'All logs are valid' };
        }
        else {
            logger_1.default.error(`Audit log integrity verification FAILED! Found ${tamperedLogs.length} tampered entries.`);
            return { success: false, tamperedLogs };
        }
    }
    catch (error) {
        logger_1.default.error('Error during audit log verification', { error: error.message });
        throw error;
    }
}
//# sourceMappingURL=verify-audit-logs.js.map