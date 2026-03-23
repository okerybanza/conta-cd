import prisma from '../../config/database';
import { CustomError } from '../../middleware/error.middleware';
import logger from '../../utils/logger';
import { eventBus } from '../../events/event-bus';
import { JournalEntryPosted, JournalEntryReversed } from '../../events/domain-event';
import journalEntryCoreService from './journalEntryCore.service';

export class JournalEntryWorkflowService {
    /**
     * Valider et poster une écriture
     */
    async post(companyId: string, entryId: string) {
        const entry = await journalEntryCoreService.getById(companyId, entryId);

        if (entry.status !== 'draft') {
            throw new CustomError('Only draft entries can be posted', 400, 'POST_RESTRICTED');
        }

        // Mettre à jour le statut
        const updated = await prisma.journal_entries.update({
            where: { id: entryId },
            data: { status: 'posted' },
        });

        // Publier l'événement
        const event = new JournalEntryPosted(
            { companyId, timestamp: new Date() },
            entry.id,
            entry.entry_number,
            entry.entry_date,
            entry.journal_entry_lines.map((l: any) => ({
                accountId: l.account_id,
                debit: Number(l.debit),
                credit: Number(l.credit),
            }))
        );

        await eventBus.publish(event);

        logger.info(`Journal entry posted: ${entryId}`, { companyId });
        return updated;
    }

    /**
     * Contrepasser une écriture (Reverse)
     */
    async reverse(companyId: string, entryId: string, userId: string, reason: string) {
        const entry = await journalEntryCoreService.getById(companyId, entryId);

        if (entry.status !== 'posted') {
            throw new CustomError('Only posted entries can be reversed', 400, 'REVERSE_RESTRICTED');
        }

        const reversalNumber = `REV-${entry.entry_number}`;

        return prisma.$transaction(async (tx) => {
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
                        entry_id: reversal.id,
                        account_id: line.account_id,
                        description: `Reversal: ${line.description || ''}`,
                        debit: line.credit, // Inversé
                        credit: line.debit, // Inversé
                        currency: line.currency,
                    },
                });
            }

            // 2. Marquer l'originale comme renversée
            const original = await tx.journal_entries.update({
                where: { id: entryId },
                data: { status: 'reversed' },
            });

            // 3. Publier l'événement
            const event = new JournalEntryReversed(
                { companyId, userId, timestamp: new Date() },
                entry.id,
                reversal.id,
                reason
            );
            await eventBus.publish(event);

            return { originalEntry: original, reversalEntry: reversal };
        });
    }
}

export default new JournalEntryWorkflowService();
