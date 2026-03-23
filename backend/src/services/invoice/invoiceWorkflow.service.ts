import prisma from '../../config/database';
import { CustomError } from '../../middleware/error.middleware';
import logger from '../../utils/logger';
import fiscalPeriodService from '../fiscalPeriod.service';
import InvoiceValidationService from '../invoiceValidation.service';
import InvoiceHistoryService from '../invoiceHistory.service';
import journalEntryService from '../journalEntry.service';
import { eventBus } from '../../events/event-bus';
import { InvoiceStatusChangedEvent } from '../../events/domain-event';
import invoiceCoreService from './invoiceCore.service';

export class InvoiceWorkflowService {
    /**
     * Mettre à jour le statut d'une facture
     */
    async updateStatus(
        companyId: string,
        invoiceId: string,
        status: string,
        userId?: string,
        justification?: string
    ) {
        // 1. Obtenir l'ID réel et la facture
        const realId = await invoiceCoreService.getInvoiceId(companyId, invoiceId);
        const invoice = await invoiceCoreService.getById(companyId, realId);

        // 2. Validation du statut
        const validStatuses = ['draft', 'sent', 'paid', 'partially_paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new CustomError('Invalid status', 400, 'INVALID_STATUS');
        }

        // 3. DOC-09: Valider la période fiscale
        const periodValidation = await fiscalPeriodService.validatePeriod(companyId, (invoice as any).invoice_date);
        if (!periodValidation.isValid) {
            throw new CustomError('Opération impossible sur une période close ou verrouillée', 400, 'INVALID_PERIOD');
        }

        const oldStatus = invoice.status as any;
        const newStatus = status as any;

        // 4. Valider la transition de statut
        InvoiceValidationService.validateStatusTransition(oldStatus, newStatus);

        // 4.5 ACCT-014: Valider la ségrégation des tâches (SoD)
        // Si l'action est une validation ou une approbation, vérifier que ce n'est pas l'auteur qui le fait
        if ((newStatus === 'sent' || newStatus === 'paid') && userId) {
            const { default: sodService } = await import('../segregationOfDuties.service');
            await sodService.validateNotSelfApproving(
                companyId,
                userId,
                'invoice',
                realId
            );
        }

        // 5. Enregistrer le changement dans l'historique
        await InvoiceHistoryService.logStatusChange(
            companyId,
            realId,
            oldStatus,
            newStatus,
            userId
        );

        // 6. Gérer les écritures comptables selon le changement de statut
        // Si on passe de 'sent'/'paid' vers 'draft'/'cancelled', supprimer/inverser les écritures
        if ((oldStatus === 'sent' || oldStatus === 'paid' || oldStatus === 'partially_paid') &&
            (status === 'draft' || status === 'cancelled')) {
            try {
                await journalEntryService.deleteForInvoice(companyId, realId);
                logger.info(`Journal entries deleted/reversed for invoice: ${realId}`, {
                    company_id: companyId,
                    invoiceId: realId,
                    oldStatus,
                    newStatus: status,
                });
            } catch (error: any) {
                logger.error('Error deleting journal entries for invoice', {
                    invoiceId: realId,
                    error: error.message,
                });
                // Ne pas interrompre si la suppression échoue, mais logger l'erreur
            }
        }

        // 7. Publier l'événement métier (DÉCLENCHE LA MISE À JOUR EN BASE VIA LE HANDLER)
        // SPRINT 1 - ARCH-007: On n'utilise plus prisma.invoices.update ici directement
        const event = new InvoiceStatusChangedEvent(
            {
                companyId,
                userId,
                timestamp: new Date(),
            },
            realId,
            (invoice as any).invoice_number,
            oldStatus,
            newStatus,
            justification || 'Status update via Workflow Service'
        );

        await eventBus.publish(event);

        logger.info(`Invoice status update event published: ${realId}`, {
            companyId,
            invoiceId: realId,
            oldStatus,
            newStatus,
        });

        return invoiceCoreService.getById(companyId, realId);
    }
}

export default new InvoiceWorkflowService();
