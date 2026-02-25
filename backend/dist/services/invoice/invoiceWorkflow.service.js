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
exports.InvoiceWorkflowService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
const logger_1 = __importDefault(require("../../utils/logger"));
const fiscalPeriod_service_1 = __importDefault(require("../fiscalPeriod.service"));
const invoiceValidation_service_1 = __importDefault(require("../invoiceValidation.service"));
const invoiceHistory_service_1 = __importDefault(require("../invoiceHistory.service"));
const journalEntry_service_1 = __importDefault(require("../journalEntry.service"));
const audit_service_1 = __importDefault(require("../audit.service"));
const event_bus_1 = require("../../events/event-bus");
const domain_event_1 = require("../../events/domain-event");
const invoiceCore_service_1 = __importDefault(require("./invoiceCore.service"));
class InvoiceWorkflowService {
    /**
     * Mettre à jour le statut d'une facture
     */
    async updateStatus(companyId, invoiceId, status, userId, justification) {
        // 1. Obtenir l'ID réel et la facture
        const realId = await invoiceCore_service_1.default.getInvoiceId(companyId, invoiceId);
        const invoice = await invoiceCore_service_1.default.getById(companyId, realId);
        // 2. Validation du statut
        const validStatuses = ['draft', 'sent', 'paid', 'partially_paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new error_middleware_1.CustomError('Invalid status', 400, 'INVALID_STATUS');
        }
        // 3. DOC-09: Valider la période fiscale
        const periodValidation = await fiscalPeriod_service_1.default.validatePeriod(companyId, invoice.invoice_date);
        if (!periodValidation.isValid) {
            throw new error_middleware_1.CustomError('Opération impossible sur une période close ou verrouillée', 400, 'INVALID_PERIOD');
        }
        const oldStatus = invoice.status;
        const newStatus = status;
        // DOC-08 / ACCT-001: justification obligatoire pour une annulation
        if (newStatus === 'cancelled') {
            if (!justification || justification.trim().length === 0) {
                throw new error_middleware_1.CustomError('Cancelling an invoice requires a justification (DOC-08 requires a justification).', 400, 'JUSTIFICATION_REQUIRED');
            }
        }
        // 4. Valider la transition de statut
        invoiceValidation_service_1.default.validateStatusTransition(oldStatus, newStatus);
        // 4.5 ACCT-014: Valider la ségrégation des tâches (SoD)
        // Si l'action est une validation ou une approbation, vérifier que ce n'est pas l'auteur qui le fait
        if ((newStatus === 'sent' || newStatus === 'paid') && userId) {
            const { default: sodService } = await Promise.resolve().then(() => __importStar(require('../segregationOfDuties.service')));
            await sodService.validateNotSelfApproving(companyId, userId, 'invoice', realId);
        }
        // 5. Enregistrer le changement dans l'historique
        await invoiceHistory_service_1.default.logStatusChange(companyId, realId, oldStatus, newStatus, userId);
        // 6. Gérer les écritures comptables selon le changement de statut
        // Si on passe de 'sent'/'paid' vers 'draft'/'cancelled', supprimer/inverser les écritures
        if ((oldStatus === 'sent' || oldStatus === 'paid' || oldStatus === 'partially_paid') &&
            (status === 'draft' || status === 'cancelled')) {
            try {
                await journalEntry_service_1.default.deleteForInvoice(companyId, realId);
                logger_1.default.info(`Journal entries deleted/reversed for invoice: ${realId}`, {
                    company_id: companyId,
                    invoiceId: realId,
                    oldStatus,
                    newStatus: status,
                });
            }
            catch (error) {
                logger_1.default.error('Error deleting journal entries for invoice', {
                    invoiceId: realId,
                    error: error.message,
                });
                // Ne pas interrompre si la suppression échoue, mais logger l'erreur
            }
        }
        // 6.5 Déterminer la raison normalisée pour l'audit
        const reason = justification && justification.trim().length > 0
            ? justification.trim()
            : 'Status update via Workflow Service';
        // 6.6 Fallback pour les environnements sans handlers d'événements (tests, scripts)
        const handlerCount = event_bus_1.eventBus.getHandlerCount('InvoiceStatusChanged');
        if (handlerCount === 0) {
            const updateData = {
                status: newStatus,
                updated_at: new Date(),
            };
            // Aligner avec le handler: définir sent_at lors du passage à "sent"
            if (newStatus === 'sent' && !invoice.sent_at) {
                updateData.sent_at = new Date();
            }
            await database_1.default.invoices.update({
                where: { id: realId },
                data: updateData,
            });
            // Créer un log d'audit de type UPDATE_STATUS pour compatibilité DOC-08 / tests
            try {
                await audit_service_1.default.createLog({
                    companyId,
                    userId,
                    action: 'UPDATE_STATUS',
                    entityType: 'invoice',
                    entityId: realId,
                    module: 'facturation',
                    beforeState: { status: oldStatus },
                    afterState: { status: newStatus },
                    justification,
                    reason,
                    metadata: {
                        previousStatus: oldStatus,
                        newStatus,
                    },
                });
            }
            catch (error) {
                logger_1.default.error('Failed to create audit log for invoice status update (fallback)', {
                    invoiceId: realId,
                    error: error.message,
                });
            }
            return invoiceCore_service_1.default.getById(companyId, realId);
        }
        // 7. Publier l'événement métier (DÉCLENCHE LA MISE À JOUR EN BASE VIA LE HANDLER)
        // SPRINT 1 - ARCH-007: On n'utilise plus prisma.invoices.update ici directement
        const event = new domain_event_1.InvoiceStatusChangedEvent({
            companyId,
            userId,
            timestamp: new Date(),
        }, realId, invoice.invoice_number, oldStatus, newStatus, reason);
        await event_bus_1.eventBus.publish(event);
        logger_1.default.info(`Invoice status update event published: ${realId}`, {
            companyId,
            invoiceId: realId,
            oldStatus,
            newStatus,
        });
        return invoiceCore_service_1.default.getById(companyId, realId);
    }
}
exports.InvoiceWorkflowService = InvoiceWorkflowService;
exports.default = new InvoiceWorkflowService();
//# sourceMappingURL=invoiceWorkflow.service.js.map