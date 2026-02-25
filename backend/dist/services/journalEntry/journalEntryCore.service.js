"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntryCoreService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
const fiscalPeriod_service_1 = __importDefault(require("../fiscalPeriod.service"));
const journalEntryHelper_service_1 = __importDefault(require("./journalEntryHelper.service"));
class JournalEntryCoreService {
    /**
     * Créer une écriture comptable
     */
    async create(companyId, data) {
        const entryDate = typeof data.entryDate === 'string' ? new Date(data.entryDate) : data.entryDate;
        const periodValidation = await fiscalPeriod_service_1.default.validatePeriod(companyId, entryDate);
        if (!periodValidation.isValid) {
            throw new error_middleware_1.CustomError(periodValidation.message || 'Période comptable invalide', 400, 'INVALID_PERIOD');
        }
        journalEntryHelper_service_1.default.validateBalance(data.lines);
        // Verify accounts
        for (const line of data.lines) {
            const account = await database_1.default.accounts.findFirst({
                where: { id: line.accountId, company_id: companyId, is_active: true },
            });
            if (!account) {
                throw new error_middleware_1.CustomError(`Account ${line.accountId} not found or inactive`, 404, 'ACCOUNT_NOT_FOUND');
            }
        }
        const entryNumber = await journalEntryHelper_service_1.default.generateEntryNumber(companyId);
        return database_1.default.$transaction(async (tx) => {
            const entry = await tx.journal_entries.create({
                data: {
                    id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
                    company_id: companyId,
                    entry_number: entryNumber,
                    entry_date: entryDate,
                    description: data.description || '',
                    reference: data.reference,
                    source_type: data.sourceType,
                    source_id: data.sourceId,
                    status: 'draft',
                    notes: data.notes,
                    created_by: data.createdBy,
                    reason: data.reason,
                    updated_at: new Date(),
                },
            });
            for (const line of data.lines) {
                await tx.journal_entry_lines.create({
                    data: {
                        id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
                        journal_entry_id: entry.id,
                        account_id: line.accountId,
                        // La description est requise dans le schéma Prisma, on fallback sur une chaîne vide si absente
                        description: line.description || '',
                        debit: line.debit,
                        credit: line.credit,
                        updated_at: new Date(),
                    },
                });
            }
            return entry;
        });
    }
    /**
     * Obtenir une écriture par ID
     */
    async getById(companyId, entryId) {
        const entry = await database_1.default.journal_entries.findFirst({
            where: { id: entryId, company_id: companyId },
            include: {
                journal_entry_lines: {
                    include: { accounts: true },
                },
                users: {
                    select: { id: true, first_name: true, last_name: true, email: true },
                },
            },
        });
        if (!entry) {
            throw new error_middleware_1.CustomError('Journal entry not found', 404, 'ENTRY_NOT_FOUND');
        }
        return entry;
    }
    /**
     * Lister les écritures
     */
    async list(companyId, filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = { company_id: companyId };
        if (filters.status)
            where.status = filters.status;
        if (filters.sourceType)
            where.source_type = filters.sourceType;
        if (filters.sourceId)
            where.source_id = filters.sourceId;
        if (filters.startDate || filters.endDate) {
            where.entry_date = {};
            if (filters.startDate)
                where.entry_date.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.entry_date.lte = new Date(filters.endDate);
        }
        if (filters.search) {
            where.OR = [
                { entry_number: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { reference: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [entries, total] = await Promise.all([
            database_1.default.journal_entries.findMany({
                where,
                include: {
                    journal_entry_lines: { include: { accounts: true } },
                },
                skip,
                take: limit,
                orderBy: { entry_date: 'desc' },
            }),
            database_1.default.journal_entries.count({ where }),
        ]);
        return {
            entries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Mettre à jour une écriture
     */
    async update(companyId, entryId, data) {
        const existing = await this.getById(companyId, entryId);
        // ARCH-010: Écritures postées immuables — corrections uniquement par reversal
        if (existing.status !== 'draft') {
            throw new error_middleware_1.CustomError('Seules les écritures en brouillon peuvent être modifiées. Pour une écriture postée, utilisez la contrepassation (reversal).', 400, 'JOURNAL_ENTRY_IMMUTABLE');
        }
        if (data.lines)
            journalEntryHelper_service_1.default.validateBalance(data.lines);
        return database_1.default.$transaction(async (tx) => {
            const updated = await tx.journal_entries.update({
                where: { id: entryId },
                data: {
                    entry_date: data.entryDate ? new Date(data.entryDate) : undefined,
                    description: data.description,
                    reference: data.reference,
                    status: data.status,
                    notes: data.notes,
                    reason: data.reason,
                },
            });
            if (data.lines) {
                await tx.journal_entry_lines.deleteMany({ where: { journal_entry_id: entryId } });
                for (const line of data.lines) {
                    await tx.journal_entry_lines.create({
                        data: {
                            id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
                            journal_entry_id: entryId,
                            account_id: line.accountId,
                            description: line.description ?? '',
                            debit: line.debit ?? 0,
                            credit: line.credit ?? 0,
                            updated_at: new Date(),
                        },
                    });
                }
            }
            return updated;
        });
    }
    /**
     * Supprimer une écriture
     */
    async delete(companyId, entryId) {
        const existing = await this.getById(companyId, entryId);
        if (existing.status !== 'draft') {
            throw new error_middleware_1.CustomError('Only draft entries can be deleted', 400, 'DELETE_RESTRICTED');
        }
        await database_1.default.journal_entries.delete({ where: { id: entryId } });
        return { success: true };
    }
}
exports.JournalEntryCoreService = JournalEntryCoreService;
exports.default = new JournalEntryCoreService();
//# sourceMappingURL=journalEntryCore.service.js.map