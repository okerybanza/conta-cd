"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceHistoryService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Service pour gérer l'historique des changements de factures
 * Pour l'instant, on utilise les logs structurés
 * Plus tard, on pourra ajouter une table InvoiceHistory dans Prisma
 */
class InvoiceHistoryService {
    /**
     * Enregistrer un changement de statut
     */
    static async logStatusChange(companyId, invoiceId, oldStatus, newStatus, userId, reason) {
        try {
            // Pour l'instant, on log dans la console/logger
            // Plus tard, on pourra créer une table InvoiceHistory
            logger_1.default.info('Invoice status changed', {
                companyId,
                invoiceId,
                oldStatus,
                newStatus,
                userId,
                reason,
                timestamp: new Date().toISOString(),
            });
            // TODO: Créer une table InvoiceHistory dans Prisma et enregistrer ici
            // await prisma.invoiceHistory.create({
            //   data: {
            //     companyId,
            //     invoiceId,
            //     field: 'status',
            //     oldValue: oldStatus,
            //     newValue: newStatus,
            //     changedBy: userId,
            //     reason,
            //   },
            // });
        }
        catch (error) {
            // Ne pas bloquer le processus si l'historique échoue
            logger_1.default.error('Error logging invoice status change', {
                invoiceId,
                error: error.message,
            });
        }
    }
    /**
     * Enregistrer une modification de facture
     */
    static async logModification(companyId, invoiceId, field, oldValue, newValue, userId) {
        try {
            logger_1.default.info('Invoice modified', {
                companyId,
                invoiceId,
                field,
                oldValue,
                newValue,
                userId,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Error logging invoice modification', {
                invoiceId,
                error: error.message,
            });
        }
    }
    /**
     * Récupérer l'historique d'une facture (pour l'instant, via les logs)
     * Plus tard, on pourra interroger la table InvoiceHistory
     */
    static async getHistory(companyId, invoiceId) {
        // Pour l'instant, retourner un tableau vide
        // Plus tard, on pourra interroger la table InvoiceHistory
        return [];
    }
}
exports.InvoiceHistoryService = InvoiceHistoryService;
exports.default = InvoiceHistoryService;
//# sourceMappingURL=invoiceHistory.service.js.map