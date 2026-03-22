"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeavePolicyService = void 0;
const database_1 = __importDefault(require("../config/database"));
const library_1 = require("@prisma/client/runtime/library");
const logger_1 = __importDefault(require("../utils/logger"));
const error_middleware_1 = require("../middleware/error.middleware");
class LeavePolicyService {
    /**
     * Créer une politique de congés
     */
    async create(companyId, data) {
        // Vérifier l'unicité du type de congé
        const existing = await database_1.default.leavePolicy.findUnique({
            where: {
                companyId_leaveType: {
                    companyId,
                    leaveType: data.leaveType,
                },
            },
        });
        if (existing) {
            throw new error_middleware_1.CustomError(`Leave policy for type ${data.leaveType} already exists`, 409, 'LEAVE_POLICY_EXISTS');
        }
        // Validation
        if (data.daysPerYear < 0) {
            throw new error_middleware_1.CustomError('Days per year must be positive', 400, 'VALIDATION_ERROR');
        }
        if (data.daysPerMonth && data.daysPerMonth < 0) {
            throw new error_middleware_1.CustomError('Days per month must be positive', 400, 'VALIDATION_ERROR');
        }
        const policy = await database_1.default.leavePolicy.create({
            data: {
                companyId,
                name: data.name,
                leaveType: data.leaveType,
                daysPerYear: new library_1.Decimal(data.daysPerYear),
                daysPerMonth: data.daysPerMonth ? new library_1.Decimal(data.daysPerMonth) : null,
                maxAccumulation: data.maxAccumulation ? new library_1.Decimal(data.maxAccumulation) : null,
                carryForward: data.carryForward ?? false,
                requiresApproval: data.requiresApproval ?? true,
                minNoticeDays: data.minNoticeDays ?? 0,
                description: data.description,
                isActive: true,
            },
        });
        logger_1.default.info(`Leave policy created: ${policy.id}`, {
            companyId,
            policyId: policy.id,
            leaveType: data.leaveType,
        });
        return policy;
    }
    /**
     * Obtenir une politique par ID
     */
    async getById(companyId, policyId) {
        const policy = await database_1.default.leavePolicy.findFirst({
            where: {
                id: policyId,
                companyId,
            },
        });
        if (!policy) {
            throw new error_middleware_1.CustomError('Leave policy not found', 404, 'LEAVE_POLICY_NOT_FOUND');
        }
        return policy;
    }
    /**
     * Obtenir une politique par type
     */
    async getByType(companyId, leaveType) {
        const policy = await database_1.default.leavePolicy.findUnique({
            where: {
                companyId_leaveType: {
                    companyId,
                    leaveType,
                },
            },
        });
        return policy;
    }
    /**
     * Lister les politiques de congés
     */
    async list(companyId, filters = {}) {
        const where = {
            companyId,
            ...(filters.leaveType && { leaveType: filters.leaveType }),
            ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        };
        const policies = await database_1.default.leavePolicy.findMany({
            where,
            orderBy: {
                leaveType: 'asc',
            },
        });
        return {
            data: policies,
            total: policies.length,
        };
    }
    /**
     * Mettre à jour une politique
     */
    async update(companyId, policyId, data) {
        const policy = await this.getById(companyId, policyId);
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.daysPerYear !== undefined) {
            if (data.daysPerYear < 0) {
                throw new error_middleware_1.CustomError('Days per year must be positive', 400, 'VALIDATION_ERROR');
            }
            updateData.daysPerYear = new library_1.Decimal(data.daysPerYear);
        }
        if (data.daysPerMonth !== undefined) {
            if (data.daysPerMonth < 0) {
                throw new error_middleware_1.CustomError('Days per month must be positive', 400, 'VALIDATION_ERROR');
            }
            updateData.daysPerMonth = data.daysPerMonth ? new library_1.Decimal(data.daysPerMonth) : null;
        }
        if (data.maxAccumulation !== undefined) {
            updateData.maxAccumulation = data.maxAccumulation
                ? new library_1.Decimal(data.maxAccumulation)
                : null;
        }
        if (data.carryForward !== undefined)
            updateData.carryForward = data.carryForward;
        if (data.requiresApproval !== undefined)
            updateData.requiresApproval = data.requiresApproval;
        if (data.minNoticeDays !== undefined)
            updateData.minNoticeDays = data.minNoticeDays;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.description !== undefined)
            updateData.description = data.description;
        const updated = await database_1.default.leavePolicy.update({
            where: { id: policyId },
            data: updateData,
        });
        logger_1.default.info(`Leave policy updated: ${policyId}`, {
            companyId,
            policyId,
        });
        return updated;
    }
    /**
     * Supprimer une politique
     */
    async delete(companyId, policyId) {
        const policy = await this.getById(companyId, policyId);
        await database_1.default.leavePolicy.delete({
            where: { id: policyId },
        });
        logger_1.default.info(`Leave policy deleted: ${policyId}`, {
            companyId,
            policyId,
        });
        return { success: true };
    }
    /**
     * Créer les politiques par défaut pour RDC
     */
    async createDefaultPolicies(companyId) {
        const defaultPolicies = [
            {
                name: 'Congés payés',
                leaveType: 'paid',
                daysPerYear: 12, // Minimum légal RDC : 1 jour/mois = 12 jours/an
                daysPerMonth: 1,
                carryForward: true,
                requiresApproval: true,
                minNoticeDays: 7,
                description: 'Congés payés annuels (minimum légal RDC)',
            },
            {
                name: 'Congés maladie',
                leaveType: 'sick',
                daysPerYear: 30,
                requiresApproval: true,
                minNoticeDays: 0,
                description: 'Congés pour maladie',
            },
            {
                name: 'Congés sans solde',
                leaveType: 'unpaid',
                daysPerYear: 0, // Pas de limite
                requiresApproval: true,
                minNoticeDays: 14,
                description: 'Congés sans rémunération',
            },
            {
                name: 'Congé maternité',
                leaveType: 'maternity',
                daysPerYear: 98, // 14 semaines selon législation RDC
                requiresApproval: true,
                minNoticeDays: 30,
                description: 'Congé maternité (14 semaines)',
            },
            {
                name: 'Congé paternité',
                leaveType: 'paternity',
                daysPerYear: 3,
                requiresApproval: true,
                minNoticeDays: 7,
                description: 'Congé paternité (3 jours)',
            },
        ];
        const created = [];
        for (const policyData of defaultPolicies) {
            try {
                const policy = await this.create(companyId, policyData);
                created.push(policy);
            }
            catch (error) {
                // Ignorer si la politique existe déjà
                if (error.code !== 'LEAVE_POLICY_EXISTS') {
                    throw error;
                }
            }
        }
        logger_1.default.info(`Default leave policies created for company: ${companyId}`, {
            companyId,
            count: created.length,
        });
        return created;
    }
}
exports.LeavePolicyService = LeavePolicyService;
exports.default = new LeavePolicyService();
//# sourceMappingURL=leavePolicy.service.js.map