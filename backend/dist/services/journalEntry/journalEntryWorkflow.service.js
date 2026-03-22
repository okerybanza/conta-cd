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
exports.JournalEntryWorkflowService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
const logger_1 = __importDefault(require("../../utils/logger"));
const event_bus_1 = require("../../events/event-bus");
const domain_event_1 = require("../../events/domain-event");
const journalEntryCore_service_1 = __importDefault(require("./journalEntryCore.service"));
const audit_service_1 = __importDefault(require("../audit.service"));
class JournalEntryWorkflowService {
    /**
     * Valider et poster une écriture
     * ACCT-014: Si userId fourni, le posteur doit être différent du créateur (ségrégation des tâches).
     */
    async post(companyId, entryId, userId) {
        const entry = await journalEntryCore_service_1.default.getById(companyId, entryId);
        if (entry.status !== 'draft') {
            throw new error_middleware_1.CustomError('Only draft entries can be posted', 400, 'POST_RESTRICTED');
        }
        if (userId) {
            const { default: sodService } = await Promise.resolve().then(() => __importStar(require('../segregationOfDuties.service')));
            await sodService.validateNotSelfApproving(companyId, userId, 'journal_entry', entryId);
        }
        // Mettre à jour le statut
        const updated = await database_1.default.journal_entries.update({
            where: { id: entryId },
            data: { status: 'posted' },
        });
        // Publier l'événement
        const event = new domain_event_1.JournalEntryPosted({ companyId, timestamp: new Date() }, entry.id, entry.entry_number, entry.entry_date, entry.journal_entry_lines.map((l) => ({
            accountId: l.account_id,
            debit: Number(l.debit),
            credit: Number(l.credit),
        })));
        await event_bus_1.eventBus.publish(event);
        // ACCT-004: Audit trail (posteur si fourni, sinon créateur)
        await audit_service_1.default.createLog({
            companyId,
            userId: userId ?? entry.created_by ?? undefined,
            action: 'JOURNAL_ENTRY_POSTED',
            entityType: 'journal_entry',
            entityId: entryId,
            module: 'comptabilite',
            afterState: { entry_number: entry.entry_number, entry_date: entry.entry_date, status: 'posted' },
        });
        logger_1.default.info(`Journal entry posted: ${entryId}`, { companyId });
        return updated;
    }
    /**
     * Contrepasser une écriture (Reverse)
     */
    async reverse(companyId, entryId, userId, reason) {
        const entry = await journalEntryCore_service_1.default.getById(companyId, entryId);
        if (entry.status !== 'posted') {
            throw new error_middleware_1.CustomError('Only posted entries can be reversed', 400, 'REVERSE_RESTRICTED');
        }
        const reversalNumber = `REV-${entry.entry_number}`;
        return database_1.default.$transaction(async (tx) => {
            // 1. Créer l'écriture de contrepassation (débits/crédits inversés)
            const reversal = await tx.journal_entries.create({
                data: {
                    company_id: companyId,
                    entry_number: reversalNumber,
                    entry_date: new Date(),
                    description: `Reversal of entry ${entry.entry_number}: ${reason}`,
                    source_type: entry.source_type,
                    source_id: entry.source_id,
                    status: 'posted',
                    created_by: userId,
                    reason: reason,
                },
            });
            for (const line of entry.journal_entry_lines) {
                await tx.journal_entry_lines.create({
                    data: {
                        id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
                        journal_entry_id: reversal.id,
                        account_id: line.account_id,
                        description: `Reversal: ${line.description || ''}`,
                        debit: line.credit, // Inversé
                        credit: line.debit, // Inversé
                        updated_at: new Date(),
                    },
                });
            }
            // 2. Marquer l'originale comme renversée
            const original = await tx.journal_entries.update({
                where: { id: entryId },
                data: { status: 'reversed' },
            });
            // 3. Publier l'événement
            const event = new domain_event_1.JournalEntryReversed({ companyId, userId, timestamp: new Date() }, entry.id, reversal.id, reason);
            await event_bus_1.eventBus.publish(event);
            // ACCT-004: Audit trail
            await audit_service_1.default.createLog({
                companyId,
                userId,
                action: 'JOURNAL_ENTRY_REVERSED',
                entityType: 'journal_entry',
                entityId: entryId,
                module: 'comptabilite',
                beforeState: { entry_number: entry.entry_number, status: 'posted' },
                afterState: { status: 'reversed', reversal_entry_id: reversal.id },
                reason,
            });
            return { originalEntry: original, reversalEntry: reversal };
        });
    }
}
exports.JournalEntryWorkflowService = JournalEntryWorkflowService;
exports.default = new JournalEntryWorkflowService();
//# sourceMappingURL=journalEntryWorkflow.service.js.map