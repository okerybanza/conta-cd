import prisma from '../config/database';
import crypto from 'crypto';

async function repairAuditChain() {
    console.log('🔄 STARTING AUDIT CHAIN REPAIR...');

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

        const calculatedHash = crypto
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

    console.log('✅ AUDIT CHAIN FULLY RE-SEALED.');
}

repairAuditChain();
