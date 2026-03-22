"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntryController = void 0;
const journalEntry_service_1 = __importDefault(require("../services/journalEntry.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        if (key === 'lines' && Array.isArray(value)) {
            // Traiter les lignes d'écriture séparément
            cleaned[key] = value.map((line) => {
                const cleanedLine = {};
                for (const [lineKey, lineValue] of Object.entries(line)) {
                    cleanedLine[lineKey] = preprocessEmptyString(lineValue);
                }
                return cleanedLine;
            });
        }
        else {
            cleaned[key] = preprocessEmptyString(value);
        }
    }
    return cleaned;
};
const journalEntryLineSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid(),
    description: zod_1.z.string().optional(),
    debit: zod_1.z.number().min(0),
    credit: zod_1.z.number().min(0),
    currency: zod_1.z.string().optional(),
});
const createJournalEntrySchema = zod_1.z.preprocess(preprocessData, zod_1.z.object({
    entryDate: zod_1.z.string().or(zod_1.z.date()),
    description: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    sourceType: zod_1.z.enum(['invoice', 'expense', 'payment', 'manual', 'credit_note', 'payroll']),
    sourceId: zod_1.z.string().uuid().optional(),
    lines: zod_1.z.array(journalEntryLineSchema).min(2),
    notes: zod_1.z.string().optional(),
    reason: zod_1.z.string().max(500).optional(), // ACCT-001: Why the entry was created (max 500 chars)
}).passthrough());
const updateJournalEntrySchema = zod_1.z.preprocess(preprocessData, zod_1.z.object({
    entryDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    description: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    sourceType: zod_1.z.enum(['invoice', 'expense', 'payment', 'manual', 'credit_note', 'payroll']).optional(),
    sourceId: zod_1.z.string().uuid().optional(),
    lines: zod_1.z.array(journalEntryLineSchema).min(2).optional(),
    notes: zod_1.z.string().optional(),
    reason: zod_1.z.string().max(500).optional(), // ACCT-001: Why the entry was modified (max 500 chars)
    status: zod_1.z.enum(['draft', 'posted', 'reversed']).optional(),
}).passthrough());
const journalEntryFiltersSchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    sourceType: zod_1.z.enum(['invoice', 'expense', 'payment', 'manual', 'credit_note', 'payroll']).optional(),
    sourceId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['draft', 'posted', 'reversed']).optional(),
    accountId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
});
class JournalEntryController {
    /**
     * POST /api/v1/journal-entries
     * Créer une écriture comptable
     */
    async create(req, res, next) {
        try {
            const data = createJournalEntrySchema.parse(req.body);
            const entry = await journalEntry_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), {
                ...data,
                createdBy: req.user.id,
            });
            res.status(201).json({
                success: true,
                data: entry,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/journal-entries
     * Lister les écritures comptables
     */
    async list(req, res, next) {
        try {
            const filters = journalEntryFiltersSchema.parse(req.query);
            const result = await journalEntry_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/journal-entries/:id
     * Obtenir une écriture par ID
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const entry = await journalEntry_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                data: entry,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/journal-entries/:id
     * Mettre à jour une écriture (seulement si draft)
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = updateJournalEntrySchema.parse(req.body);
            const entry = await journalEntry_service_1.default.update((0, auth_middleware_1.getCompanyId)(req), id, data);
            res.json({
                success: true,
                data: entry,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/journal-entries/:id/post
     * Poster une écriture (changer de draft à posted)
     * ACCT-014: Ségrégation des tâches — le posteur doit être différent du créateur si plusieurs utilisateurs.
     */
    async post(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const entry = await journalEntry_service_1.default.post((0, auth_middleware_1.getCompanyId)(req), id, userId);
            res.json({
                success: true,
                data: entry,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/journal-entries/:id/reverse
     * SPRINT 1 - TASK 1.3 (ARCH-010): Reverse a posted journal entry
     * Creates a compensating entry with flipped debits/credits
     */
    async reverse(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
                throw new error_middleware_1.CustomError('Reason is required for journal entry reversal (ACCT-001)', 400, 'REASON_REQUIRED');
            }
            const result = await journalEntry_service_1.default.reverse((0, auth_middleware_1.getCompanyId)(req), id, req.user.id, reason);
            res.json({
                success: true,
                data: result,
                message: 'Journal entry reversed successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/journal-entries/:id
     * Supprimer une écriture (seulement si draft)
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await journalEntry_service_1.default.delete((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                message: 'Journal entry deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.JournalEntryController = JournalEntryController;
exports.default = new JournalEntryController();
//# sourceMappingURL=journalEntry.controller.js.map