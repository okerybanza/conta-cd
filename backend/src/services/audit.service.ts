import prisma from '../config/database';
import logger from '../utils/logger';
import { randomUUID } from 'crypto';
import crypto from 'crypto';

export interface AuditLogData {
  companyId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;        // DOC-08: Role at time of action
  action?: string;
  entityType?: string;
  entityId?: string;
  module?: string;          // DOC-08: Context (facturation, stock, rh, comptabilite)
  beforeState?: Record<string, any>;  // DOC-08: State before action
  afterState?: Record<string, any>;   // DOC-08: State after action
  changes?: Record<string, any>;
  justification?: string;   // DOC-08: Mandatory for critical actions
  reason?: string;          // ACCT-001: Why the change occurred (max 500 chars)
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Actions requiring mandatory justification (DOC-08)
   */
  private readonly ACTIONS_REQUIRING_JUSTIFICATION = [
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
  private validateJustification(action: string, justification?: string): void {
    if (this.ACTIONS_REQUIRING_JUSTIFICATION.includes(action)) {
      if (!justification || justification.trim().length === 0) {
        throw new Error(
          `Action "${action}" requires a justification (DOC-08 compliance)`
        );
      }
    }
  }

  // Créer un log d'audit
  async createLog(data: AuditLogData) {
    try {
      // DOC-08: Validate justification for critical actions
      this.validateJustification(data.action, data.justification);

      // SPRINT 2 - TASK 2.1 (ACCT-012): Cryptographic Hash Chaining
      // 1. Get the latest audit log to find its hash
      const latestLog = await prisma.audit_logs.findFirst({
        orderBy: { created_at: 'desc' },
        select: { hash: true },
      });

      const previousHash = latestLog?.hash || '0'.repeat(64); // Genesis hash if no previous log exists

      // 2. Prepare content for hashing
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
        timestamp: new Date().toISOString(), // Use fixed timestamp for hash
      };

      const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(logContent))
        .digest('hex');

      const log = await prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          company_id: data.companyId,
          user_id: data.userId,
          user_role: data.userRole,
          action: data.action,
          entity: data.entityType,
          entity_id: data.entityId,
          module: data.module,
          before_state: data.beforeState as any,
          after_state: data.afterState as any,
          changes: data.changes as any,
          justification: data.justification,
          reason: data.reason, // ACCT-001: Audit trail explanation
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          hash: hash,
          previous_hash: previousHash,
          created_at: new Date(),
        },
      });

      logger.info('Audit log created with cryptographic hash', {
        auditLogId: log.id,
        action: data.action,
        hash: hash.substring(0, 8) + '...',
      });

      return log;
    } catch (error: any) {
      // DOC-08: If justification is missing, throw error (don't silently fail)
      if (error.message?.includes('requires a justification')) {
        throw error;
      }

      // Other errors: log but don't fail the operation
      logger.error('Error creating audit log', {
        error: error.message,
        action: data.action,
      });
    }
  }

  // Logger une action CREATE
  async logCreate(
    companyId: string | undefined,
    userId: string | undefined,
    userEmail: string | undefined,
    userRole: string | undefined,  // DOC-08
    entityType: string,
    entityId: string,
    data: Record<string, any>,
    module?: string,                // DOC-08
    justification?: string,         // DOC-08
    ipAddress?: string,
    userAgent?: string
  ) {
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
  async logUpdate(
    companyId: string | undefined,
    userId: string | undefined,
    userEmail: string | undefined,
    userRole: string | undefined,  // DOC-08
    entityType: string,
    entityId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    module?: string,                // DOC-08
    justification?: string,         // DOC-08
    ipAddress?: string,
    userAgent?: string
  ) {
    // Calculer les changements
    const changes: Record<string, any> = {};
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
  async logDelete(
    companyId: string | undefined,
    userId: string | undefined,
    userEmail: string | undefined,
    userRole: string | undefined,  // DOC-08
    entityType: string,
    entityId: string,
    data: Record<string, any>,
    module?: string,                // DOC-08
    justification?: string,         // DOC-08 (mandatory for DELETE)
    ipAddress?: string,
    userAgent?: string
  ) {
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
  async logRead(
    companyId: string | undefined,
    userId: string | undefined,
    userEmail: string | undefined,
    entityType: string,
    entityId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
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
  async logCustom(
    companyId: string | undefined,
    userId: string | undefined,
    userEmail: string | undefined,
    action: string,
    entityType: string,
    entityId: string | undefined,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
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
  async getLogs(
    companyId?: string,
    filters?: {
      userId?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

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
      prisma.audit_logs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.audit_logs.count({ where }),
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
    const { verifyAuditLogIntegrity } = await import('../scripts/verify-audit-logs');
    return verifyAuditLogIntegrity();
  }
}

export default new AuditService();

