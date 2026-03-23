/**
 * InvoiceHandlers
 * 
 * Handles invoice data changes and deletion events
 * SPRINT 1 - TASK 1.1: Replace direct UPDATE with event-based pattern
 */

import { InvoiceUpdated, InvoiceDeleted } from '../domain-event';
import { EventHandler } from '../event-bus';
import prisma from '../../config/database';
import auditService from '../../services/audit.service';
import logger from '../../utils/logger';

export const handleInvoiceUpdated: EventHandler<InvoiceUpdated> = async (event: InvoiceUpdated) => {
    logger.info('Processing InvoiceUpdated event', {
        invoiceId: event.invoiceId,
        changes: JSON.stringify(event.changes),
        hasLines: !!event.lines
    });

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Mettre à jour la facture
            const inv = await tx.invoices.update({
                where: { id: event.invoiceId },
                data: {
                    ...event.changes,
                    updated_at: event.occurredAt
                },
            });

            // 2. Si lignes fournies, remplacer les anciennes
            if (event.lines) {
                logger.debug('Replacing invoice lines', { count: event.lines.length });
                await tx.invoice_lines.deleteMany({ where: { invoice_id: event.invoiceId } });
                for (const line of event.lines) {
                    await tx.invoice_lines.create({
                        data: {
                            id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
                            invoice_id: event.invoiceId,
                            product_id: line.productId,
                            description: line.description || line.name,
                            quantity: line.quantity,
                            unit_price: line.unitPrice,
                            tax_rate: line.taxRate || 0,
                            subtotal: line.quantity * line.unitPrice,
                            total: (line.quantity * line.unitPrice) * (1 + (line.taxRate || 0) / 100),
                            updated_at: event.occurredAt
                        },
                    });
                }
            }

            // 3. Log audit
            await auditService.createLog({
                companyId: event.metadata.companyId,
                userId: event.metadata.userId,
                action: 'INVOICE_UPDATED',
                entityType: 'invoice',
                entityId: event.invoiceId,
                module: 'facturation',
                afterState: { changes: event.changes, hasLines: !!event.lines },
                metadata: { eventId: event.id }
            });
        });

        logger.info('Invoice data updated successfully via event', { invoiceId: event.invoiceId });
    } catch (error: any) {
        logger.error('Failed to handle InvoiceUpdated event', {
            invoiceId: event.invoiceId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

export const handleInvoiceDeleted: EventHandler<InvoiceDeleted> = async (event: InvoiceDeleted) => {
    logger.info('Processing InvoiceDeleted event', { invoiceId: event.invoiceId });

    try {
        await prisma.invoices.update({
            where: { id: event.invoiceId },
            data: {
                deleted_at: event.occurredAt,
                updated_at: event.occurredAt
            },
        });

        await auditService.createLog({
            companyId: event.metadata.companyId,
            userId: event.metadata.userId,
            action: 'INVOICE_DELETED',
            entityType: 'invoice',
            entityId: event.invoiceId,
            module: 'facturation',
            afterState: { deleted_at: event.occurredAt },
            justification: event.reason,
            metadata: { eventId: event.id }
        });

        logger.info('Invoice soft-deleted successfully via event', { invoiceId: event.invoiceId });
    } catch (error: any) {
        logger.error('Failed to handle InvoiceDeleted event', {
            invoiceId: event.invoiceId,
            error: error.message
        });
        throw error;
    }
};
