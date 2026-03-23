import prisma from '../../config/database';
import { CustomError } from '../../middleware/error.middleware';
import invoiceHelperService, { UpdateInvoiceData } from './invoiceHelper.service';
import invoiceCoreService from './invoiceCore.service';

export class InvoiceUpdateService {
    /**
     * Mettre à jour une facture
     */
    async update(companyId: string, invoiceId: string, data: UpdateInvoiceData, userId?: string) {
        const existingInvoice = await invoiceCoreService.getById(companyId, invoiceId);

        // Seules les factures en brouillon peuvent être modifiées en profondeur
        if (existingInvoice.status !== 'draft' && data.lines) {
            throw new CustomError('Only draft invoices can have their lines modified', 400, 'UPDATE_RESTRICTED');
        }

        const updateData: any = {};
        if (data.reason) updateData.reason = data.reason;

        // Si les lignes sont modifiées, recalculer les totaux
        if (data.lines) {
            const totals = invoiceHelperService.calculateTotals(data.lines);
            updateData.subtotal = totals.subtotal;
            updateData.tax_amount = totals.taxAmount;
            updateData.total_amount = totals.totalAmount;
        }

        // SPRINT 1 - TASK 1.1: Replace direct UPDATE with event-based pattern
        const { eventBus } = await import('../../events/event-bus');
        const { InvoiceUpdated } = await import('../../events/domain-event');

        const event = new InvoiceUpdated(
            {
                companyId,
                userId,
                timestamp: new Date(),
            },
            invoiceId,
            updateData,
            data.lines
        );

        await eventBus.publish(event);

        return invoiceCoreService.getById(companyId, invoiceId);
    }
}

export default new InvoiceUpdateService();
