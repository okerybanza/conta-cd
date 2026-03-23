import prisma from '../../config/database';
import { CustomError } from '../../middleware/error.middleware';
import invoiceCoreService from './invoiceCore.service';

export class InvoiceDeleteService {
    /**
     * Supprimer une facture
     */
    async delete(companyId: string, invoiceId: string, userId?: string, justification?: string) {
        const invoice = await invoiceCoreService.getById(companyId, invoiceId);

        // Seules les factures en brouillon peuvent être supprimées physiquement (ou soft delete simple)
        // Les factures validées doivent être annulées (via workflow)
        if (invoice.status !== 'draft') {
            throw new CustomError('Only draft invoices can be deleted. Validated invoices must be cancelled.', 400, 'DELETE_RESTRICTED');
        }

        // SPRINT 1 - TASK 1.1: Replace direct UPDATE with event-based pattern
        const { eventBus } = await import('../../events/event-bus');
        const { InvoiceDeleted } = await import('../../events/domain-event');

        const event = new InvoiceDeleted(
            {
                companyId,
                userId,
                timestamp: new Date(),
            },
            invoice.id,
            justification || 'Soft delete via Delete Service'
        );

        await eventBus.publish(event);

        return { success: true };
    }
}

export default new InvoiceDeleteService();
