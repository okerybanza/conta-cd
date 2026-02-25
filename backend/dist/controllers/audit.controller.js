"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const audit_service_1 = __importDefault(require("../services/audit.service"));
class AuditController {
    // Obtenir les logs d'audit
    async getLogs(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                userId: req.query.userId,
                action: req.query.action,
                entityType: req.query.entityType,
                entityId: req.query.entityId,
                startDate: req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined,
                endDate: req.query.endDate
                    ? new Date(req.query.endDate)
                    : undefined,
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 50,
            };
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const result = await audit_service_1.default.getLogs(companyId, filters);
            res.json({
                success: true,
                data: result.logs,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir un log spécifique
    async getLog(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const log = await audit_service_1.default.getLogs(companyId, {
                entityId: id,
                limit: 1,
            });
            if (log.logs.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Log not found',
                });
            }
            res.json({
                success: true,
                data: log.logs[0],
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Vérifier l'intégrité de la chaîne de hashage
    async verifyIntegrity(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            // Seul un super admin ou un rôle spécifique peut vérifier l'intégrité globale
            // Pour l'instant on laisse passer si authentifié, mais on pourrait ajouter une vérif de rôle
            const result = await audit_service_1.default.verifyIntegrity();
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuditController = AuditController;
exports.default = new AuditController();
//# sourceMappingURL=audit.controller.js.map