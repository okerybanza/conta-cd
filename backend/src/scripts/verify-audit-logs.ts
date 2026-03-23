import prisma from '../config/database';
import crypto from 'crypto';
import logger from '../utils/logger';

/**
 * SPRINT 2 - TASK 2.1 (ACCT-012): Verify Audit Log Integrity
 * 
 * This script checks the entire hash chain of the audit logs to detect any tampering
 */
export async function verifyAuditLogIntegrity() {
    logger.info('Starting audit log integrity verification...');

    try {
        const logs = await prisma.audit_logs.findMany({
            orderBy: { created_at: 'asc' },
        });

        let isValid = true;
        let tamperedLogs: string[] = [];
        let currentPreviousHash = '0'.repeat(64);

        for (const log of logs) {
            // 1. Check if previous_hash matches the expected chain
            if (log.previous_hash !== currentPreviousHash) {
                isValid = false;
                tamperedLogs.push(log.id);
                logger.error(`Chain broken at log ID: ${log.id}. Expected previous hash: ${currentPreviousHash}, Found: ${log.previous_hash}`);
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

            const calculatedHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(logContent))
                .digest('hex');

            if (log.hash !== calculatedHash) {
                isValid = false;
                tamperedLogs.push(log.id);
                logger.error(`Hash mismatch at log ID: ${log.id}. Calculated: ${calculatedHash}, Stored: ${log.hash}`);
            }

            currentPreviousHash = log.hash || '';
        }

        if (isValid) {
            logger.info('Audit log integrity verification successful! All logs are valid.');
            return { success: true, message: 'All logs are valid' };
        } else {
            logger.error(`Audit log integrity verification FAILED! Found ${tamperedLogs.length} tampered entries.`);
            return { success: false, tamperedLogs };
        }
    } catch (error: any) {
        logger.error('Error during audit log verification', { error: error.message });
        throw error;
    }
}
