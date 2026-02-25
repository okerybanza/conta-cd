"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
/**
 * Audit service — ACCT-011: append-only audit log.
 * The audit_logs table is immutable: only INSERT (createLog) is allowed.
 * UPDATE/DELETE are blocked at DB (trigger) and at application level (Prisma extension).
 */
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = require("crypto");
const crypto_2 = __importDefault(require("crypto"));
class AuditService {
    /**
     * Actions requiring mandatory justification (DOC-08)
     */
    ACTIONS_REQUIRING_JUSTIFICATION = [
        'CANCEL_INVOICE',
        'ADJUST_STOCK',
        'CORRECT_ACCOUNTING',
        'REOPEN_PERIOD',
        'DELETE',
        'REVERSE_PAYROLL',
    ];
    /**
     * Validate justification for critical actions (DOC-08)
     */
    validateJustification(action, justification) {
        if (this.ACTIONS_REQUIRING_JUSTIFICATION.includes(action)) {
            if (!justification || justification.trim().length === 0) {
                throw new Error(`Action "${action}" requires a justification (DOC-08 compliance)`);
            }
        }
    }
    // Créer un log d'audit
    async createLog(data) {
        try {
            // DOC-08: Validate justification for critical actions
            this.validateJustification(data.action, data.justification);
            // SPRINT 2 - TASK 2.1 (ACCT-012): Cryptographic Hash Chaining
            // 1. Get the latest audit log to find its hash
            const latestLog = await database_1.default.audit_logs.findFirst({
                orderBy: { created_at: 'desc' },
                select: { hash: true },
            });
            const previousHash = latestLog?.hash || '0'.repeat(64); // Genesis hash if no previous log exists
            // 2. Prepare content for hashing (same structure as verify-audit-logs.ts / repair scripts)
            const now = new Date();
            const logContent = {
                companyId: data.companyId,
                userId: data.userId,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                module: data.module,
                beforeState: data.beforeState,
                afterState: data.afterState,
                justification: data.justification,
                reason: data.reason,
                previousHash,
                timestamp: now.toISOString(),
            };
            const hash = crypto_2.default
                .createHash('sha256')
                .update(JSON.stringify(logContent))
                .digest('hex');
            const log = await database_1.default.audit_logs.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    company_id: data.companyId,
                    user_id: data.userId,
                    user_role: data.userRole,
                    action: data.action,
                    entity: data.entityType,
                    entity_id: data.entityId,
                    module: data.module,
                    before_state: data.beforeState,
                    after_state: data.afterState,
                    changes: data.changes,
                    justification: data.justification,
                    reason: data.reason, // ACCT-001: Audit trail explanation
                    ip_address: data.ipAddress,
                    user_agent: data.userAgent,
                    hash: hash,
                    previous_hash: previousHash,
                    created_at: now,
                },
            });
            logger_1.default.info('Audit log created with cryptographic hash', {
                auditLogId: log.id,
                action: data.action,
                hash: hash.substring(0, 8) + '...',
            });
            return log;
        }
        catch (error) {
            // DOC-08: If justification is missing, throw error (don't silently fail)
            if (error.message?.includes('requires a justification')) {
                throw error;
            }
            // Other errors: log but don't fail the operation
            logger_1.default.error('Error creating audit log', {
                error: error.message,
                action: data.action,
            });
        }
    }
    // Logger une action CREATE
    async logCreate(companyId, userId, userEmail, userRole, // DOC-08
    entityType, entityId, data, module, // DOC-08
    justification, // DOC-08
    ipAddress, userAgent) {
        return this.createLog({
            companyId,
            userId,
            userEmail,
            userRole,
            action: 'CREATE',
            entityType,
            entityId,
            module,
            beforeState: undefined,
            afterState: data,
            changes: { created: data },
            justification,
            metadata: { operation: 'create' },
            ipAddress,
            userAgent,
        });
    }
    // Logger une action UPDATE
    async logUpdate(companyId, userId, userEmail, userRole, // DOC-08
    entityType, entityId, oldData, newData, module, // DOC-08
    justification, // DOC-08
    ipAddress, userAgent) {
        // Calculer les changements
        const changes = {};
        const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
        for (const key of allKeys) {
            const oldValue = oldData[key];
            const newValue = newData[key];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes[key] = {
                    from: oldValue,
                    to: newValue,
                };
            }
        }
        return this.createLog({
            companyId,
            userId,
            userEmail,
            userRole,
            action: 'UPDATE',
            entityType,
            entityId,
            module,
            beforeState: oldData,
            afterState: newData,
            changes,
            justification,
            metadata: { operation: 'update' },
            ipAddress,
            userAgent,
        });
    }
    // Logger une action DELETE
    async logDelete(companyId, userId, userEmail, userRole, // DOC-08
    entityType, entityId, data, module, // DOC-08
    justification, // DOC-08 (mandatory for DELETE)
    ipAddress, userAgent) {
        return this.createLog({
            companyId,
            userId,
            userEmail,
            userRole,
            action: 'DELETE',
            entityType,
            entityId,
            module,
            beforeState: data,
            afterState: undefined,
            changes: { deleted: data },
            justification,
            metadata: { operation: 'delete' },
            ipAddress,
            userAgent,
        });
    }
    // Logger une action READ (optionnel, pour actions sensibles)
    async logRead(companyId, userId, userEmail, entityType, entityId, ipAddress, userAgent) {
        return this.createLog({
            companyId,
            userId,
            userEmail,
            action: 'READ',
            entityType,
            entityId,
            metadata: { operation: 'read' },
            ipAddress,
            userAgent,
        });
    }
    // Logger une action personnalisée
    async logCustom(companyId, userId, userEmail, action, entityType, entityId, metadata, ipAddress, userAgent) {
        return this.createLog({
            companyId,
            userId,
            userEmail,
            action,
            entityType,
            entityId,
            metadata,
            ipAddress,
            userAgent,
        });
    }
    // Obtenir les logs d'audit
    async getLogs(companyId, filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const skip = (page - 1) * limit;
        const where = {};
        if (companyId) {
            where.company_id = companyId;
        }
        if (filters?.userId) {
            where.user_id = filters.userId;
        }
        if (filters?.action) {
            where.action = filters.action;
        }
        if (filters?.entityType) {
            where.entity = filters.entityType;
        }
        if (filters?.entityId) {
            where.entity_id = filters.entityId;
        }
        if (filters?.startDate || filters?.endDate) {
            where.created_at = {};
            if (filters.startDate) {
                where.created_at.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.created_at.lte = filters.endDate;
            }
        }
        const [logs, total] = await Promise.all([
            database_1.default.audit_logs.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            database_1.default.audit_logs.count({ where }),
        ]);
        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * SPRINT 2 - TASK 2.1: Verify audit log integrity
     */
    async verifyIntegrity() {
        const { verifyAuditLogIntegrity } = await Promise.resolve().then(() => __importStar(require('../scripts/verify-audit-logs')));
        return verifyAuditLogIntegrity();
    }
}
exports.AuditService = AuditService;
exports.default = new AuditService();
//# sourceMappingURL=audit.service.js.map