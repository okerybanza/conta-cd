"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const crypto_1 = __importDefault(require("crypto"));
async function debugAuditLogs() {
    const logs = await database_1.default.audit_logs.findMany({
        orderBy: { created_at: 'asc' },
    });
    console.log(`Analyzing ${logs.length} audit logs...`);
    let currentPreviousHash = '0'.repeat(64);
    for (const log of logs) {
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
        if (log.previous_hash !== currentPreviousHash || log.hash !== calculatedHash) {
            console.log('--- TAMPERING DETECTED ---');
            console.log(`Log ID: ${log.id}`);
            console.log(`Action: ${log.action}`);
            console.log(`Stored Previous Hash: ${log.previous_hash}`);
            console.log(`Expected Previous Hash: ${currentPreviousHash}`);
            console.log(`Stored Hash: ${log.hash}`);
            console.log(`Calculated Hash: ${calculatedHash}`);
            console.log(`Content: ${JSON.stringify(logContent, null, 2)}`);
            break;
        }
        currentPreviousHash = log.hash || '';
    }
}
debugAuditLogs();
//# sourceMappingURL=debug-audit-logs.js.map