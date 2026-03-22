"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
async function masterRepair() {
    console.log('🔓 UNLOCKING AUDIT TABLE...');
    await prisma.$executeRawUnsafe('ALTER TABLE audit_logs DISABLE TRIGGER enforce_audit_log_immutability');
    try {
        const logs = await prisma.audit_logs.findMany({
            orderBy: { created_at: 'asc' },
        });
        console.log(`Re-sealing ${logs.length} logs...`);
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
                previousHash: currentPreviousHash,
                timestamp: log.created_at.toISOString(),
            };
            const calculatedHash = crypto_1.default
                .createHash('sha256')
                .update(JSON.stringify(logContent))
                .digest('hex');
            await prisma.audit_logs.update({
                where: { id: log.id },
                data: {
                    previous_hash: currentPreviousHash,
                    hash: calculatedHash
                }
            });
            currentPreviousHash = calculatedHash;
        }
        console.log('✅ AUDIT CHAIN RE-SEALED SUCCESSFULLY.');
    }
    finally {
        console.log('🔒 RE-LOCKING AUDIT TABLE...');
        await prisma.$executeRawUnsafe('ALTER TABLE audit_logs ENABLE TRIGGER enforce_audit_log_immutability');
        await prisma.$disconnect();
    }
}
masterRepair();
//# sourceMappingURL=master-repair-audit.js.map