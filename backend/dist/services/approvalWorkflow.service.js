"use strict";
/**
 * ACCT-006: Moteur de workflow d'approbation (fondation)
 * Demande d'approbation générique pour tout type d'entité (invoice, journal_entry, etc.).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalWorkflowService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
class ApprovalWorkflowService {
    /**
     * Créer une demande d'approbation pour une entité.
     * Une seule demande en attente par (company, entity_type, entity_id).
     */
    async request(input) {
        const existing = await database_1.default.approval_requests.findFirst({
            where: {
                company_id: input.companyId,
                entity_type: input.entityType,
                entity_id: input.entityId,
                status: 'pending',
            },
        });
        if (existing) {
            throw new error_middleware_1.CustomError('Une demande d\'approbation est déjà en attente pour cette entité', 400, 'APPROVAL_PENDING');
        }
        const request = await database_1.default.approval_requests.create({
            data: {
                company_id: input.companyId,
                entity_type: input.entityType,
                entity_id: input.entityId,
                status: 'pending',
                requested_by: input.requestedBy,
                comments: input.comments,
                updated_at: new Date(),
            },
        });
        logger_1.default.info('Approval request created (ACCT-006)', {
            requestId: request.id,
            entityType: input.entityType,
            entityId: input.entityId,
            companyId: input.companyId,
        });
        return request;
    }
    /**
     * Approuver une demande (un autre utilisateur que le demandeur doit approuver).
     */
    async approve(input) {
        const request = await database_1.default.approval_requests.findFirst({
            where: { id: input.requestId, company_id: input.companyId },
        });
        if (!request) {
            throw new error_middleware_1.CustomError('Demande d\'approbation introuvable', 404, 'APPROVAL_NOT_FOUND');
        }
        if (request.status !== 'pending') {
            throw new error_middleware_1.CustomError(`La demande est déjà ${request.status}`, 400, 'INVALID_STATUS');
        }
        if (request.requested_by === input.userId) {
            throw new error_middleware_1.CustomError('Vous ne pouvez pas approuver votre propre demande (ségrégation des tâches)', 403, 'SOD_VIOLATION');
        }
        const updated = await database_1.default.approval_requests.update({
            where: { id: input.requestId },
            data: {
                status: 'approved',
                approved_by: input.userId,
                approved_at: new Date(),
                comments: input.comments ?? request.comments,
                updated_at: new Date(),
            },
        });
        logger_1.default.info('Approval request approved (ACCT-006)', {
            requestId: input.requestId,
            approvedBy: input.userId,
        });
        return updated;
    }
    /**
     * Rejeter une demande (avec motif).
     */
    async reject(input) {
        if (!input.rejectionReason?.trim()) {
            throw new error_middleware_1.CustomError('Le motif de rejet est obligatoire', 400, 'REJECTION_REASON_REQUIRED');
        }
        const request = await database_1.default.approval_requests.findFirst({
            where: { id: input.requestId, company_id: input.companyId },
        });
        if (!request) {
            throw new error_middleware_1.CustomError('Demande d\'approbation introuvable', 404, 'APPROVAL_NOT_FOUND');
        }
        if (request.status !== 'pending') {
            throw new error_middleware_1.CustomError(`La demande est déjà ${request.status}`, 400, 'INVALID_STATUS');
        }
        const updated = await database_1.default.approval_requests.update({
            where: { id: input.requestId },
            data: {
                status: 'rejected',
                rejected_by: input.userId,
                rejected_at: new Date(),
                rejection_reason: input.rejectionReason,
                comments: input.comments ?? request.comments,
                updated_at: new Date(),
            },
        });
        logger_1.default.info('Approval request rejected (ACCT-006)', {
            requestId: input.requestId,
            rejectedBy: input.userId,
        });
        return updated;
    }
    /**
     * Récupérer la demande en attente pour une entité, s'il y en a une.
     */
    async getPending(companyId, entityType, entityId) {
        return database_1.default.approval_requests.findFirst({
            where: {
                company_id: companyId,
                entity_type: entityType,
                entity_id: entityId,
                status: 'pending',
            },
        });
    }
    /**
     * Lister les demandes (par company, optionnellement par statut ou type).
     */
    async list(companyId, filters) {
        const where = { company_id: companyId };
        if (filters?.status)
            where.status = filters.status;
        if (filters?.entityType)
            where.entity_type = filters.entityType;
        if (filters?.requestedBy)
            where.requested_by = filters.requestedBy;
        return database_1.default.approval_requests.findMany({
            where,
            orderBy: { requested_at: 'desc' },
        });
    }
}
exports.ApprovalWorkflowService = ApprovalWorkflowService;
exports.default = new ApprovalWorkflowService();
//# sourceMappingURL=approvalWorkflow.service.js.map