"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepreciationService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const account_service_1 = __importDefault(require("./account.service"));
const journalEntry_service_1 = __importDefault(require("./journalEntry.service"));
const library_1 = require("@prisma/client/runtime/library");
class DepreciationService {
    /**
     * Calculer l'amortissement accumulé à partir des écritures comptables
     */
    async calculateAccumulatedDepreciation(companyId, depreciationId) {
        // Récupérer toutes les écritures comptables liées à cette dépréciation
        const entries = await database_1.default.journal_entries.findMany({
            where: {
                companyId,
                sourceType: 'depreciation',
                sourceId: depreciationId,
                status: 'posted',
            },
            include: {
                lines: {
                    where: {
                        account: {
                        // Compte d'amortissement
                        },
                    },
                },
            },
        });
        // Calculer le total des crédits sur le compte d'amortissement
        let accumulated = 0;
        for (const entry of entries) {
            for (const line of entry.lines) {
                // Pour un compte d'amortissement (passif), les crédits augmentent l'amortissement accumulé
                accumulated += Number(line.credit);
            }
        }
        return accumulated;
    }
    /**
     * Calculer l'amortissement mensuel (linéaire)
     */
    calculateLinearMonthlyDepreciation(acquisitionCost, usefulLife) {
        if (usefulLife <= 0) {
            throw new error_middleware_1.CustomError('Useful life must be greater than 0', 400, 'INVALID_USEFUL_LIFE');
        }
        const annualDepreciation = acquisitionCost / usefulLife;
        return annualDepreciation / 12;
    }
    /**
     * Calculer l'amortissement mensuel (dégressif)
     */
    calculateDecliningMonthlyDepreciation(acquisitionCost, depreciationRate, accumulatedDepreciation) {
        if (depreciationRate <= 0 || depreciationRate > 100) {
            throw new error_middleware_1.CustomError('Depreciation rate must be between 0 and 100', 400, 'INVALID_DEPRECIATION_RATE');
        }
        const netBookValue = acquisitionCost - accumulatedDepreciation;
        const annualDepreciation = (netBookValue * depreciationRate) / 100;
        return annualDepreciation / 12;
    }
    /**
     * Créer un plan d'amortissement
     */
    async create(companyId, data, userId) {
        // Vérifier que les comptes existent et appartiennent à la compagnie
        const assetAccount = await account_service_1.default.getById(companyId, data.assetAccountId);
        const depreciationAccount = await account_service_1.default.getById(companyId, data.depreciationAccountId);
        // Vérifier que les comptes sont du bon type
        if (assetAccount.type !== 'asset') {
            throw new error_middleware_1.CustomError('Asset account must be of type "asset"', 400, 'INVALID_ACCOUNT_TYPE');
        }
        // Calculer l'amortissement mensuel initial
        let monthlyDepreciation;
        if (data.depreciationMethod === 'linear') {
            monthlyDepreciation = this.calculateLinearMonthlyDepreciation(data.acquisitionCost, data.usefulLife);
        }
        else if (data.depreciationMethod === 'declining') {
            if (!data.depreciationRate) {
                throw new error_middleware_1.CustomError('Depreciation rate is required for declining method', 400, 'MISSING_DEPRECIATION_RATE');
            }
            monthlyDepreciation = this.calculateDecliningMonthlyDepreciation(data.acquisitionCost, data.depreciationRate, 0 // Pas encore d'amortissement accumulé
            );
        }
        else {
            throw new error_middleware_1.CustomError('Invalid depreciation method. Must be "linear" or "declining"', 400, 'INVALID_DEPRECIATION_METHOD');
        }
        const purchaseDate = typeof data.acquisitionDate === 'string'
            ? new Date(data.acquisitionDate)
            : data.acquisitionDate;
        const depreciation = await database_1.default.depreciation.create({
            data: {
                companyId,
                assetAccountId: data.assetAccountId,
                depreciationAccountId: data.depreciationAccountId,
                description: data.assetName || '',
                purchaseDate,
                purchaseAmount: new library_1.Decimal(data.acquisitionCost),
                depreciationMethod: data.depreciationMethod,
                depreciationRate: data.depreciationRate
                    ? new library_1.Decimal(data.depreciationRate)
                    : new library_1.Decimal((100 / data.usefulLife)), // Calculer le taux si non fourni
                startDate: purchaseDate,
                isActive: true,
            },
            include: {
                assetAccount: true,
                depreciationAccount: true,
            },
        });
        logger_1.default.info(`Depreciation plan created: ${depreciation.id}`, {
            companyId,
            assetName: data.assetName,
        });
        return depreciation;
    }
    /**
     * Obtenir un plan d'amortissement par ID
     */
    async getById(companyId, depreciationId) {
        const depreciation = await database_1.default.depreciation.findFirst({
            where: {
                id: depreciationId,
                companyId,
            },
            include: {
                assetAccount: true,
                depreciationAccount: true,
            },
        });
        if (!depreciation) {
            throw new error_middleware_1.CustomError('Depreciation not found', 404, 'DEPRECIATION_NOT_FOUND');
        }
        return depreciation;
    }
    /**
     * Lister les plans d'amortissement
     */
    async list(companyId, filters = {}) {
        const where = {
            companyId,
        };
        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        const depreciations = await database_1.default.depreciation.findMany({
            where,
            include: {
                assetAccount: true,
                depreciationAccount: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return depreciations;
    }
    /**
     * Mettre à jour un plan d'amortissement
     */
    async update(companyId, depreciationId, data) {
        const depreciation = await this.getById(companyId, depreciationId);
        // Si l'amortissement est désactivé, on ne peut pas le modifier
        if (!depreciation.isActive && data.isActive !== true) {
            throw new error_middleware_1.CustomError('Cannot update inactive depreciation', 400, 'CANNOT_UPDATE_INACTIVE');
        }
        // Calculer l'amortissement mensuel à partir des données du modèle
        const purchaseAmount = Number(depreciation.purchaseAmount);
        const depreciationRate = Number(depreciation.depreciationRate);
        // Calculer usefulLife à partir de depreciationRate (usefulLife = 100 / rate)
        const usefulLife = depreciationRate > 0 ? 100 / depreciationRate : 0;
        // Calculer accumulatedDepreciation à partir des écritures comptables
        const accumulated = await this.calculateAccumulatedDepreciation(companyId, depreciationId);
        let monthlyDepreciation = 0;
        if (data.depreciationMethod || data.usefulLife || data.depreciationRate) {
            const method = data.depreciationMethod || depreciation.depreciationMethod;
            const calculatedUsefulLife = data.usefulLife || usefulLife;
            if (method === 'linear') {
                monthlyDepreciation = this.calculateLinearMonthlyDepreciation(purchaseAmount, calculatedUsefulLife);
            }
            else if (method === 'declining') {
                const rate = data.depreciationRate
                    ? data.depreciationRate
                    : depreciationRate;
                monthlyDepreciation = this.calculateDecliningMonthlyDepreciation(purchaseAmount, rate, accumulated);
            }
        }
        const updated = await database_1.default.depreciation.update({
            where: { id: depreciationId },
            data: {
                ...(data.assetName && { description: data.assetName }),
                ...(data.depreciationMethod && { depreciationMethod: data.depreciationMethod }),
                ...(data.depreciationRate !== undefined && { depreciationRate: new library_1.Decimal(data.depreciationRate) }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
            include: {
                assetAccount: true,
                depreciationAccount: true,
            },
        });
        logger_1.default.info(`Depreciation updated: ${depreciationId}`, { companyId });
        return updated;
    }
    /**
     * Calculer l'amortissement mensuel actuel
     */
    async calculateMonthlyDepreciation(companyId, depreciationId) {
        const depreciation = await this.getById(companyId, depreciationId);
        const purchaseAmount = Number(depreciation.purchaseAmount);
        const depreciationRate = Number(depreciation.depreciationRate);
        const usefulLife = depreciationRate > 0 ? 100 / depreciationRate : 0;
        const accumulated = await this.calculateAccumulatedDepreciation(companyId, depreciationId);
        // Vérifier si l'actif est complètement amorti
        if (accumulated >= purchaseAmount) {
            return 0;
        }
        if (depreciation.depreciationMethod === 'linear') {
            return this.calculateLinearMonthlyDepreciation(purchaseAmount, usefulLife);
        }
        else {
            const purchaseAmount = Number(depreciation.purchaseAmount);
            const rate = Number(depreciation.depreciationRate || 0);
            return this.calculateDecliningMonthlyDepreciation(purchaseAmount, rate, accumulated);
        }
    }
    /**
     * Générer une écriture d'amortissement pour un mois donné
     */
    async generateDepreciationEntry(companyId, depreciationId, period, // Format: "2025-01"
    userId) {
        const depreciation = await this.getById(companyId, depreciationId);
        if (!depreciation.isActive) {
            throw new error_middleware_1.CustomError('Cannot generate entry for inactive depreciation', 400, 'INACTIVE_DEPRECIATION');
        }
        // Parser la période
        const [year, month] = period.split('-').map(Number);
        const entryDate = new Date(year, month - 1, 1);
        // Calculer l'amortissement mensuel
        const monthlyDepreciation = await this.calculateMonthlyDepreciation(companyId, depreciationId);
        if (monthlyDepreciation <= 0) {
            throw new error_middleware_1.CustomError('Asset is fully depreciated', 400, 'FULLY_DEPRECIATED');
        }
        // Vérifier si une écriture existe déjà pour cette période
        const existingEntry = await database_1.default.journal_entries.findFirst({
            where: {
                companyId,
                sourceType: 'manual',
                // reference n'existe pas dans JournalEntry, utiliser description pour identifier
            },
        });
        if (existingEntry) {
            throw new error_middleware_1.CustomError(`Depreciation entry already exists for period ${period}`, 400, 'ENTRY_ALREADY_EXISTS');
        }
        // Créer l'écriture comptable
        const entry = await journalEntry_service_1.default.create(companyId, {
            entryDate,
            description: `Amortissement - ${depreciation.description} (${period})`,
            // reference n'existe pas dans JournalEntry
            sourceType: 'manual',
            lines: [
                {
                    accountId: depreciation.depreciationAccountId,
                    description: `Amortissement - ${depreciation.description}`,
                    debit: monthlyDepreciation,
                    credit: 0,
                },
                {
                    accountId: depreciation.assetAccountId,
                    description: `Amortissement - ${depreciation.description}`,
                    debit: 0,
                    credit: monthlyDepreciation,
                },
            ],
            createdBy: userId,
        });
        // L'amortissement accumulé est calculé à partir des écritures comptables, pas stocké dans le modèle
        // Pas besoin de mettre à jour accumulatedDepreciation car il n'existe pas dans le modèle
        logger_1.default.info(`Depreciation entry generated: ${entry.id}`, {
            companyId,
            depreciationId,
            period,
        });
        return entry;
    }
    /**
     * Générer le tableau d'amortissement complet
     */
    async generateDepreciationTable(companyId, depreciationId) {
        const depreciation = await this.getById(companyId, depreciationId);
        const purchaseDate = depreciation.purchaseDate;
        const purchaseAmount = Number(depreciation.purchaseAmount);
        const depreciationRate = Number(depreciation.depreciationRate);
        // Calculer usefulLife à partir de depreciationRate (usefulLife = 100 / rate)
        const usefulLife = depreciationRate > 0 ? 100 / depreciationRate : 0;
        const method = depreciation.depreciationMethod;
        const rate = depreciationRate;
        const table = [];
        let accumulated = await this.calculateAccumulatedDepreciation(companyId, depreciationId);
        let currentDate = new Date(purchaseDate);
        const endDate = new Date(purchaseDate);
        endDate.setFullYear(endDate.getFullYear() + usefulLife);
        while (currentDate < endDate && accumulated < purchaseAmount) {
            let monthlyDepreciation;
            if (method === 'linear') {
                monthlyDepreciation = this.calculateLinearMonthlyDepreciation(purchaseAmount, usefulLife);
            }
            else {
                monthlyDepreciation = this.calculateDecliningMonthlyDepreciation(purchaseAmount, rate || 0, accumulated);
            }
            // S'assurer qu'on ne dépasse pas le coût d'acquisition
            if (accumulated + monthlyDepreciation > purchaseAmount) {
                monthlyDepreciation = purchaseAmount - accumulated;
            }
            accumulated += monthlyDepreciation;
            const netBookValue = purchaseAmount - accumulated;
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const period = `${year}-${month}`;
            table.push({
                period,
                date: new Date(currentDate),
                monthlyDepreciation,
                accumulatedDepreciation: accumulated,
                netBookValue,
            });
            // Passer au mois suivant
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return table;
    }
    /**
     * Supprimer un plan d'amortissement
     */
    async delete(companyId, depreciationId) {
        const depreciation = await this.getById(companyId, depreciationId);
        // Vérifier qu'il n'y a pas d'écritures liées
        const entries = await database_1.default.journal_entries.findMany({
            where: {
                companyId,
                sourceType: 'manual',
                description: {
                    startsWith: `DEP-${depreciationId}-`,
                },
            },
        });
        if (entries.length > 0) {
            throw new error_middleware_1.CustomError('Cannot delete depreciation with existing entries', 400, 'HAS_ENTRIES');
        }
        await database_1.default.depreciation.delete({
            where: { id: depreciationId },
        });
        logger_1.default.info(`Depreciation deleted: ${depreciationId}`, { companyId });
    }
    /**
     * Traiter tous les amortissements actifs pour générer les écritures du mois précédent
     * Cette méthode est appelée par le scheduler mensuel
     */
    async processMonthlyDepreciations() {
        const now = new Date();
        // Calculer le mois précédent
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const period = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
        logger_1.default.info('Processing monthly depreciations', { period });
        // Récupérer tous les plans d'amortissement actifs
        const depreciations = await database_1.default.depreciation.findMany({
            where: {
                isActive: true,
            },
            include: {
                company: true,
            },
        });
        logger_1.default.info(`Found ${depreciations.length} active depreciation plans`);
        const results = [];
        for (const depreciation of depreciations) {
            try {
                // Vérifier si l'actif est complètement amorti
                const purchaseAmount = Number(depreciation.purchaseAmount);
                const accumulated = await this.calculateAccumulatedDepreciation(depreciation.companyId, depreciation.id);
                if (accumulated >= purchaseAmount) {
                    logger_1.default.info(`Depreciation ${depreciation.id} is fully depreciated, skipping`);
                    results.push({
                        depreciationId: depreciation.id,
                        companyId: depreciation.companyId,
                        success: true,
                        skipped: true,
                        reason: 'Fully depreciated',
                    });
                    continue;
                }
                // Vérifier si une écriture existe déjà pour cette période
                const existingEntry = await database_1.default.journal_entries.findFirst({
                    where: {
                        companyId: depreciation.companyId,
                        sourceType: 'manual',
                        description: {
                            startsWith: `DEP-${depreciation.id}-${period}`,
                        },
                    },
                });
                if (existingEntry) {
                    logger_1.default.info(`Entry already exists for depreciation ${depreciation.id} period ${period}`);
                    results.push({
                        depreciationId: depreciation.id,
                        companyId: depreciation.companyId,
                        success: true,
                        skipped: true,
                        reason: 'Entry already exists',
                    });
                    continue;
                }
                // Vérifier que la date d'acquisition est antérieure ou égale au mois précédent
                const purchaseDate = depreciation.purchaseDate;
                if (purchaseDate > previousMonth) {
                    logger_1.default.info(`Depreciation ${depreciation.id} acquisition date is after ${period}, skipping`);
                    results.push({
                        depreciationId: depreciation.id,
                        companyId: depreciation.companyId,
                        success: true,
                        skipped: true,
                        reason: 'Acquisition date after period',
                    });
                    continue;
                }
                // Générer l'écriture d'amortissement
                const entry = await this.generateDepreciationEntry(depreciation.companyId, depreciation.id, period);
                logger_1.default.info(`Depreciation entry generated: ${entry.id}`, {
                    depreciationId: depreciation.id,
                    companyId: depreciation.companyId,
                    period,
                });
                results.push({
                    depreciationId: depreciation.id,
                    companyId: depreciation.companyId,
                    entryId: entry.id,
                    success: true,
                });
            }
            catch (error) {
                logger_1.default.error('Failed to process depreciation', {
                    depreciationId: depreciation.id,
                    companyId: depreciation.companyId,
                    error: error.message,
                    stack: error.stack,
                });
                results.push({
                    depreciationId: depreciation.id,
                    companyId: depreciation.companyId,
                    success: false,
                    error: error.message,
                });
            }
        }
        logger_1.default.info('Monthly depreciations processing completed', {
            total: depreciations.length,
            successful: results.filter((r) => r.success && !r.skipped).length,
            skipped: results.filter((r) => r.skipped).length,
            failed: results.filter((r) => !r.success).length,
        });
        return results;
    }
}
exports.DepreciationService = DepreciationService;
exports.default = new DepreciationService();
//# sourceMappingURL=depreciation.service.js.map