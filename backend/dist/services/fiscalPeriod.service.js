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
exports.FiscalPeriodService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = require("crypto");
/**
 * Mapper les données Prisma vers le format attendu par le frontend
 */
const mapFiscalPeriod = (period) => {
    return {
        ...period,
        id: period.id,
        companyId: period.company_id,
        name: period.name,
        startDate: period.start_date,
        endDate: period.end_date,
        status: period.status,
        isClosed: period.status === 'closed',
        isLocked: period.status === 'locked',
    };
};
class FiscalPeriodService {
    /**
     * Crée automatiquement la période fiscale de l'année en cours
     * si aucune période n'existe pour cette entreprise
     */
    async ensureCurrentYearPeriod(companyId) {
        const currentYear = new Date().getFullYear();
        const existing = await database_1.default.fiscal_periods.findFirst({
            where: {
                company_id: companyId,
                start_date: {
                    gte: new Date(`${currentYear}-01-01`),
                    lt: new Date(`${currentYear + 1}-01-01`),
                },
            },
        });
        if (existing) {
            return;
        }
        await database_1.default.fiscal_periods.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                company_id: companyId,
                name: `Exercice ${currentYear}`,
                start_date: new Date(`${currentYear}-01-01`),
                end_date: new Date(`${currentYear}-12-31`),
                status: 'open',
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        logger_1.default.info(`Auto-created fiscal period ${currentYear} for company ${companyId}`);
    }
    /**
     * Créer un exercice comptable
     */
    async create(companyId, data, userId) {
        const startDate = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
        const endDate = typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate;
        // Valider les dates
        if (startDate >= endDate) {
            throw new error_middleware_1.CustomError('La date de début doit être antérieure à la date de fin', 400, 'INVALID_DATES');
        }
        // Vérifier qu'il n'y a pas de chevauchement avec un autre exercice
        const overlappingPeriod = await database_1.default.fiscal_periods.findFirst({
            where: {
                company_id: companyId,
                OR: [
                    {
                        start_date: {
                            lte: endDate,
                        },
                        end_date: {
                            gte: startDate,
                        },
                    },
                ],
            },
        });
        if (overlappingPeriod) {
            throw new error_middleware_1.CustomError(`Un exercice existe déjà pour cette période (${overlappingPeriod.name})`, 400, 'OVERLAPPING_PERIOD');
        }
        const period = await database_1.default.fiscal_periods.create({
            data: {
                id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
                company_id: companyId,
                name: data.name,
                start_date: startDate,
                end_date: endDate,
                notes: data.notes,
                updated_at: new Date(),
            },
        });
        logger_1.default.info(`Fiscal period created: ${period.id}`, { companyId, periodId: period.id });
        return mapFiscalPeriod(period);
    }
    /**
     * Obtenir un exercice par ID
     */
    async getById(companyId, periodId) {
        const period = await database_1.default.fiscal_periods.findFirst({
            where: {
                id: periodId,
                company_id: companyId,
            },
        });
        if (!period) {
            throw new error_middleware_1.CustomError('Fiscal period not found', 404, 'PERIOD_NOT_FOUND');
        }
        return mapFiscalPeriod(period);
    }
    /**
     * Lister les exercices
     */
    async list(companyId, filters = {}) {
        const where = {
            company_id: companyId,
        };
        if (filters.isClosed !== undefined) {
            where.status = filters.isClosed ? 'closed' : 'open';
        }
        if (filters.isLocked !== undefined) {
            if (filters.isLocked) {
                where.status = 'locked';
            }
            else {
                // si non verrouillé: on exclut seulement locked
                where.status = { not: 'locked' };
            }
        }
        if (filters.year) {
            where.start_date = {
                gte: new Date(`${filters.year}-01-01`),
                lt: new Date(`${filters.year + 1}-01-01`),
            };
        }
        const periods = await database_1.default.fiscal_periods.findMany({
            where,
            orderBy: {
                start_date: 'desc',
            },
        });
        return periods.map(mapFiscalPeriod);
    }
    /**
     * Obtenir l'exercice en cours (non clos)
     */
    async getCurrent(companyId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentPeriod = await database_1.default.fiscal_periods.findFirst({
            where: {
                company_id: companyId,
                start_date: {
                    lte: today,
                },
                end_date: {
                    gte: today,
                },
                status: {
                    in: ['open', 'locked'],
                },
            },
            orderBy: {
                start_date: 'desc',
            },
        });
        return currentPeriod ? mapFiscalPeriod(currentPeriod) : null;
    }
    /**
     * Vérifier qu'une date est dans une période ouverte
     */
    async validatePeriod(companyId, date) {
        const period = await database_1.default.fiscal_periods.findFirst({
            where: {
                company_id: companyId,
                start_date: {
                    lte: date,
                },
                end_date: {
                    gte: date,
                },
            },
        });
        if (!period) {
            return {
                isValid: false,
                message: `Aucun exercice comptable trouvé pour la date ${date.toISOString().split('T')[0]}. Toutes les transactions financières doivent être dans une période valide.`,
            };
        }
        if (period.status === 'closed') {
            return {
                isValid: false,
                period,
                message: `L'exercice "${period.name}" est clos. Aucune modification n'est autorisée.`,
            };
        }
        if (period.status === 'locked') {
            return {
                isValid: false,
                period,
                message: `L'exercice "${period.name}" est verrouillé. Aucune modification n'est autorisée.`,
            };
        }
        return {
            isValid: true,
            period,
        };
    }
    /**
     * Helper pour vérifier si une période est verrouillée/close (P0001/P0002 compliance)
     */
    async checkLock(companyId, date) {
        const result = await this.validatePeriod(companyId, date);
        if (!result.isValid) {
            const code = result.message?.includes('clos') ? 'PERIOD_CLOSED' :
                result.message?.includes('verrouillé') ? 'PERIOD_LOCKED' : 'PERIOD_NOT_FOUND';
            throw new error_middleware_1.CustomError(result.message || 'Période invalide', 400, code, {
                date,
                periodName: result.period?.name
            });
        }
    }
    /**
     * Clôturer un exercice (DOC-09)
     */
    async close(companyId, periodId, userId, userRole) {
        const period = await this.getById(companyId, periodId);
        if (period.status === 'closed') {
            throw new error_middleware_1.CustomError('Cet exercice est déjà clos', 400, 'ALREADY_CLOSED');
        }
        if (period.status === 'locked') {
            throw new error_middleware_1.CustomError('Cet exercice est verrouillé. Déverrouillez-le avant de le clôturer.', 400, 'PERIOD_LOCKED');
        }
        const updated = await database_1.default.fiscal_periods.update({
            where: { id: periodId },
            data: {
                status: 'closed',
                closed_at: new Date(),
                closed_by: userId,
                updated_at: new Date(),
            },
        });
        logger_1.default.info(`Fiscal period closed: ${periodId}`, { companyId, periodId, userId });
        // DOC-09 + DOC-08: Audit trail
        const auditService = (await Promise.resolve().then(() => __importStar(require('./audit.service')))).default;
        await auditService.createLog({
            companyId,
            userId,
            userRole,
            action: 'CLOSE_PERIOD',
            entityType: 'fiscal_period',
            entityId: periodId,
            module: 'comptabilite',
            beforeState: { status: period.status },
            afterState: { status: 'closed', closed_at: new Date(), closed_by: userId },
            metadata: { periodName: period.name },
        });
        return mapFiscalPeriod(updated);
    }
    /**
     * Rouvrir un exercice (DOC-09: exige justification + audit)
     */
    async reopen(companyId, periodId, userId, userRole, justification) {
        const period = await this.getById(companyId, periodId);
        if (period.status !== 'closed') {
            throw new error_middleware_1.CustomError('Cet exercice n\'est pas clos', 400, 'NOT_CLOSED');
        }
        // ACCT-006 Phase 2: Réouverture soumise à approbation préalable
        // On exige une demande d'approbation approuvée pour (company, 'fiscal_period_reopen', periodId).
        const approvedRequest = await database_1.default.approval_requests.findFirst({
            where: {
                company_id: companyId,
                entity_type: 'fiscal_period_reopen',
                entity_id: periodId,
                status: 'approved',
            },
        });
        if (!approvedRequest) {
            throw new error_middleware_1.CustomError('Reopening a fiscal period requires a prior approved approval request.', 403, 'APPROVAL_REQUIRED');
        }
        // ACCT-014 Phase 2: Ségrégation des tâches sur la réouverture
        // Si plusieurs utilisateurs actifs existent, la période ne doit pas être rouverte
        // par le même utilisateur que celui qui l'a clôturée.
        if (period.closed_by && period.closed_by === userId) {
            const userCount = await database_1.default.users.count({
                where: {
                    company_id: companyId,
                    deleted_at: null,
                },
            });
            if (userCount > 1) {
                throw new error_middleware_1.CustomError('Segregation of Duties Violation: The fiscal period must be reopened by a different user than the one who closed it.', 403, 'SOD_VIOLATION');
            }
        }
        // DOC-09: Justification obligatoire pour réouverture
        if (!justification || justification.trim().length === 0) {
            throw new error_middleware_1.CustomError('La réouverture d\'une période clôturée exige une justification écrite (DOC-09 compliance)', 400, 'JUSTIFICATION_REQUIRED');
        }
        const updated = await database_1.default.fiscal_periods.update({
            where: { id: periodId },
            data: {
                status: 'open',
                closed_at: null,
                closed_by: null,
                updated_at: new Date(),
            },
        });
        logger_1.default.warn(`Fiscal period reopened: ${periodId}`, { companyId, periodId, userId, justification });
        // DOC-09 + DOC-08: Audit trail avec justification
        const auditService = (await Promise.resolve().then(() => __importStar(require('./audit.service')))).default;
        await auditService.createLog({
            companyId,
            userId,
            userRole,
            action: 'REOPEN_PERIOD',
            entityType: 'fiscal_period',
            entityId: periodId,
            module: 'comptabilite',
            beforeState: { status: 'closed' },
            afterState: { status: 'open' },
            justification, // DOC-09: Mandatory justification
            metadata: { periodName: period.name },
        });
        return mapFiscalPeriod(updated);
    }
    /**
     * Verrouiller une période (DOC-09)
     */
    async lock(companyId, periodId, userId, userRole) {
        const period = await this.getById(companyId, periodId);
        if (period.status === 'locked') {
            throw new error_middleware_1.CustomError('Cette période est déjà verrouillée', 400, 'ALREADY_LOCKED');
        }
        const updated = await database_1.default.fiscal_periods.update({
            where: { id: periodId },
            data: {
                status: 'locked',
                updated_at: new Date(),
            },
        });
        logger_1.default.info(`Fiscal period locked: ${periodId}`, { companyId, periodId, userId });
        // DOC-09 + DOC-08: Audit trail
        const auditService = (await Promise.resolve().then(() => __importStar(require('./audit.service')))).default;
        await auditService.createLog({
            companyId,
            userId,
            userRole,
            action: 'LOCK_PERIOD',
            entityType: 'fiscal_period',
            entityId: periodId,
            module: 'comptabilite',
            beforeState: { status: period.status },
            afterState: { status: 'locked' },
            metadata: { periodName: period.name },
        });
        return mapFiscalPeriod(updated);
    }
    /**
     * Déverrouiller une période (DOC-09)
     */
    async unlock(companyId, periodId, userId, userRole) {
        const period = await this.getById(companyId, periodId);
        if (period.status !== 'locked') {
            throw new error_middleware_1.CustomError('Cette période n\'est pas verrouillée', 400, 'NOT_LOCKED');
        }
        const updated = await database_1.default.fiscal_periods.update({
            where: { id: periodId },
            data: {
                status: 'open',
                updated_at: new Date(),
            },
        });
        logger_1.default.info(`Fiscal period unlocked: ${periodId}`, { companyId, periodId, userId });
        // DOC-09 + DOC-08: Audit trail
        const auditService = (await Promise.resolve().then(() => __importStar(require('./audit.service')))).default;
        await auditService.createLog({
            companyId,
            userId,
            userRole,
            action: 'UNLOCK_PERIOD',
            entityType: 'fiscal_period',
            entityId: periodId,
            module: 'comptabilite',
            beforeState: { status: 'locked' },
            afterState: { status: 'open' },
            metadata: { periodName: period.name },
        });
        return mapFiscalPeriod(updated);
    }
    /**
     * Mettre à jour un exercice
     */
    async update(companyId, periodId, data) {
        const period = await this.getById(companyId, periodId);
        if (period.status === 'closed') {
            throw new error_middleware_1.CustomError('Impossible de modifier un exercice clos', 400, 'PERIOD_CLOSED');
        }
        if (period.status === 'locked') {
            throw new error_middleware_1.CustomError('Impossible de modifier une période verrouillée', 400, 'PERIOD_LOCKED');
        }
        const updateData = {
            updated_at: new Date(),
        };
        if (data.name !== undefined) {
            updateData.name = data.name;
        }
        if (data.startDate !== undefined) {
            updateData.start_date = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
        }
        if (data.endDate !== undefined) {
            updateData.end_date = typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate;
        }
        if (data.notes !== undefined) {
            updateData.notes = data.notes;
        }
        // Valider les dates si les deux sont présentes
        if (updateData.start_date && updateData.end_date) {
            const startDate = updateData.start_date;
            const endDate = updateData.end_date;
            if (startDate >= endDate) {
                throw new error_middleware_1.CustomError('La date de début doit être antérieure à la date de fin', 400, 'INVALID_DATES');
            }
        }
        const updated = await database_1.default.fiscal_periods.update({
            where: { id: periodId },
            data: updateData,
        });
        logger_1.default.info(`Fiscal period updated: ${periodId}`, { companyId, periodId });
        return mapFiscalPeriod(updated);
    }
    /**
     * Supprimer un exercice
     */
    async delete(companyId, periodId) {
        const period = await this.getById(companyId, periodId);
        if (period.status === 'closed') {
            throw new error_middleware_1.CustomError('Impossible de supprimer un exercice clos', 400, 'PERIOD_CLOSED');
        }
        if (period.status === 'locked') {
            throw new error_middleware_1.CustomError('Impossible de supprimer une période verrouillée', 400, 'PERIOD_LOCKED');
        }
        // Vérifier qu'il n'y a pas d'écritures dans cette période
        const entriesCount = await database_1.default.journal_entries.count({
            where: {
                company_id: companyId,
                entry_date: {
                    gte: period.startDate,
                    lte: period.endDate,
                },
            },
        });
        if (entriesCount > 0) {
            throw new error_middleware_1.CustomError(`Impossible de supprimer cet exercice car il contient ${entriesCount} écriture(s) comptable(s)`, 400, 'PERIOD_HAS_ENTRIES');
        }
        await database_1.default.fiscal_periods.delete({
            where: { id: periodId },
        });
        logger_1.default.info(`Fiscal period deleted: ${periodId}`, { companyId, periodId });
        return { success: true, message: 'Exercice supprimé avec succès' };
    }
}
exports.FiscalPeriodService = FiscalPeriodService;
exports.default = new FiscalPeriodService();
//# sourceMappingURL=fiscalPeriod.service.js.map