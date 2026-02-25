"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalWorkflowController = void 0;
const approvalWorkflow_service_1 = __importDefault(require("../services/approvalWorkflow.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
class ApprovalWorkflowController {
    /** POST /api/v1/approval-requests — Créer une demande d'approbation */
    async request(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }
            const { entityType, entityId, comments } = req.body;
            if (!entityType || !entityId) {
                return res.status(400).json({
                    success: false,
                    message: 'entityType et entityId sont requis',
                });
            }
            const request = await approvalWorkflow_service_1.default.request({
                companyId,
                entityType,
                entityId,
                requestedBy: userId,
                comments,
            });
            res.status(201).json({ success: true, data: request });
        }
        catch (error) {
            next(error);
        }
    }
    /** POST /api/v1/approval-requests/:id/approve — Approuver */
    async approve(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }
            const { id } = req.params;
            const { comments } = req.body || {};
            const request = await approvalWorkflow_service_1.default.approve({
                companyId,
                requestId: id,
                userId,
                comments,
            });
            res.json({ success: true, data: request });
        }
        catch (error) {
            next(error);
        }
    }
    /** POST /api/v1/approval-requests/:id/reject — Rejeter */
    async reject(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }
            const { id } = req.params;
            const { rejectionReason, comments } = req.body || {};
            const request = await approvalWorkflow_service_1.default.reject({
                companyId,
                requestId: id,
                userId,
                rejectionReason,
                comments,
            });
            res.json({ success: true, data: request });
        }
        catch (error) {
            next(error);
        }
    }
    /** GET /api/v1/approval-requests — Lister (filtres: status, entityType, requestedBy) */
    async list(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const { status, entityType, requestedBy } = req.query;
            const list = await approvalWorkflow_service_1.default.list(companyId, {
                status,
                entityType,
                requestedBy,
            });
            res.json({ success: true, data: list });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ApprovalWorkflowController = ApprovalWorkflowController;
exports.default = new ApprovalWorkflowController();
//# sourceMappingURL=approvalWorkflow.controller.js.map