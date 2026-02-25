"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegregationOfDutiesService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * SPRINT 2 - TASK 2.2 (ACCT-014): Segregation of Duties Service
 *
 * Enforces the "4-eyes" principle where a user cannot perform multiple
 * conflicting actions in a financial workflow (e.g., Create vs Approve).
 */
class SegregationOfDutiesService {
    /**
     * Validates if the user is allowed to perform a "validation/approval" action on an entity.
     *
     * @param companyId Company context
     * @param userId The ID of the user attempting the action
     * @param entityType 'invoice' | 'payment' | 'journal_entry'
     * @param entityId The ID of the specific record
     * @throws CustomError if self-approval is detected
     */
    async validateNotSelfApproving(companyId, userId, entityType, entityId) {
        logger_1.default.debug('Validating Segregation of Duties', { companyId, userId, entityType, entityId });
        let record;
        try {
            switch (entityType) {
                case 'invoice':
                    record = await database_1.default.invoices.findUnique({
                        where: { id: entityId },
                        select: { created_by: true },
                    });
                    break;
                case 'payment':
                    record = await database_1.default.payments.findUnique({
                        where: { id: entityId },
                        select: { created_by: true },
                    });
                    break;
                case 'journal_entry':
                    record = await database_1.default.journal_entries.findUnique({
                        where: { id: entityId },
                        select: { created_by: true },
                    });
                    break;
                case 'expense':
                    // ACCT-014 Phase 2: étendre la SoD aux dépenses
                    record = await database_1.default.expense.findUnique({
                        where: { id: entityId },
                        select: { created_by: true },
                    });
                    break;
                case 'payroll':
                    // ACCT-014 Phase 2: SoD sur la validation de paie
                    // Utiliser l'audit log pour retrouver le créateur de la paie
                    {
                        const auditLog = await database_1.default.audit_logs.findFirst({
                            where: {
                                company_id: companyId,
                                entity: 'payroll',
                                entity_id: entityId,
                                action: 'CREATE',
                            },
                            orderBy: { created_at: 'asc' },
                        });
                        if (auditLog) {
                            record = { created_by: auditLog.user_id };
                        }
                    }
                    break;
            }
            if (!record) {
                throw new error_middleware_1.CustomError(`${entityType} not found`, 404, 'ENTITY_NOT_FOUND');
            }
            // ACCT-014: Check for small company exception
            // If the company only has one active user, we must allow self-approval
            // to avoid blocking the workflow entirely.
            const userCount = await database_1.default.users.count({
                where: {
                    company_id: companyId,
                    deleted_at: null
                }
            });
            if (userCount <= 1) {
                logger_1.default.info('Small company exception applied for SoD', {
                    companyId,
                    userId,
                    userCount
                });
                return;
            }
            // ACCT-014: If the person approving/validating is the one who created it
            if (record.created_by === userId) {
                logger_1.default.warn('Self-approval attempt blocked (SoD violation)', {
                    userId,
                    entityType,
                    entityId,
                    companyId
                });
                throw new error_middleware_1.CustomError(`Segregation of Duties Violation: You cannot approve or validate a ${entityType} that you created. A different user must perform this action.`, 403, 'SOD_VIOLATION');
            }
            logger_1.default.info('Segregation of Duties validation passed', { userId, entityType, entityId });
        }
        catch (error) {
            if (error instanceof error_middleware_1.CustomError)
                throw error;
            logger_1.default.error('Error in SegregationOfDutiesService', { error: error.message });
            throw new error_middleware_1.CustomError('Failed to validate Segregation of Duties', 500);
        }
    }
}
exports.SegregationOfDutiesService = SegregationOfDutiesService;
exports.default = new SegregationOfDutiesService();
//# sourceMappingURL=segregationOfDuties.service.js.map