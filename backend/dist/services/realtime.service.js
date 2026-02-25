"use strict";
/**
 * Service pour les mises à jour en temps réel
 * Utilise Server-Sent Events (SSE) pour notifier les clients
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const logger_1 = __importDefault(require("../utils/logger"));
class RealtimeService extends events_1.EventEmitter {
    clients = new Map();
    /**
     * Enregistrer un client SSE
     */
    registerClient(sessionId, companyId, res) {
        if (!this.clients.has(sessionId)) {
            this.clients.set(sessionId, new Set());
        }
        const client = { companyId, res };
        this.clients.get(sessionId).add(client);
        // Envoyer un message de connexion
        this.sendToClient(sessionId, client, {
            type: 'connected',
            message: 'Connected to real-time updates',
            timestamp: new Date(),
        });
        logger_1.default.info('Client registered for real-time updates', {
            sessionId,
            companyId,
            totalClients: this.clients.size,
        });
        // Nettoyer lors de la déconnexion
        res.on('close', () => {
            this.unregisterClient(sessionId, client);
        });
    }
    /**
     * Désenregistrer un client
     */
    unregisterClient(sessionId, client) {
        const clients = this.clients.get(sessionId);
        if (clients) {
            clients.delete(client);
            if (clients.size === 0) {
                this.clients.delete(sessionId);
            }
        }
        logger_1.default.info('Client unregistered from real-time updates', {
            sessionId,
            companyId: client.companyId,
            totalClients: this.clients.size,
        });
    }
    /**
     * Envoyer un événement à un client spécifique
     */
    sendToClient(sessionId, client, event) {
        try {
            if (!client.res.writable || client.res.destroyed) {
                this.unregisterClient(sessionId, client);
                return;
            }
            client.res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
        catch (error) {
            logger_1.default.error('Error sending SSE event to client', {
                sessionId,
                companyId: client.companyId,
                error: error.message,
            });
            this.unregisterClient(sessionId, client);
        }
    }
    /**
     * Émettre un événement à tous les clients d'une entreprise
     */
    emitToCompany(companyId, event) {
        let sentCount = 0;
        for (const [sessionId, clients] of this.clients.entries()) {
            for (const client of clients) {
                if (client.companyId === companyId) {
                    this.sendToClient(sessionId, client, event);
                    sentCount++;
                }
            }
        }
        logger_1.default.debug('Event emitted to company', {
            companyId,
            eventType: event.type,
            sentCount,
        });
    }
    /**
     * Émettre un événement de mise à jour des stats du dashboard
     */
    emitDashboardStatsUpdate(companyId, stats) {
        this.emitToCompany(companyId, {
            type: 'dashboard_stats',
            companyId,
            data: stats,
            timestamp: new Date(),
        });
    }
    /**
     * Émettre un événement de création de facture
     */
    emitInvoiceCreated(companyId, invoice) {
        this.emitToCompany(companyId, {
            type: 'invoice_created',
            companyId,
            data: invoice,
            timestamp: new Date(),
        });
    }
    /**
     * Émettre un événement de mise à jour de facture
     */
    emitInvoiceUpdated(companyId, invoice) {
        this.emitToCompany(companyId, {
            type: 'invoice_updated',
            companyId,
            data: invoice,
            timestamp: new Date(),
        });
    }
    /**
     * Émettre un événement de changement de statut de facture
     */
    emitInvoiceStatusChanged(companyId, invoiceId, oldStatus, newStatus) {
        this.emitToCompany(companyId, {
            type: 'invoice_status_changed',
            companyId,
            data: {
                invoiceId,
                oldStatus,
                newStatus,
            },
            timestamp: new Date(),
        });
    }
    /**
     * Émettre un événement de création de paiement
     */
    emitPaymentCreated(companyId, payment) {
        this.emitToCompany(companyId, {
            type: 'payment_created',
            companyId,
            data: payment,
            timestamp: new Date(),
        });
    }
    /**
     * Émettre un événement de création de dépense
     */
    emitExpenseCreated(companyId, expense) {
        this.emitToCompany(companyId, {
            type: 'expense_created',
            companyId,
            data: expense,
            timestamp: new Date(),
        });
    }
    /**
     * Émettre un événement de mise à jour de dépense
     */
    emitExpenseUpdated(companyId, expense) {
        this.emitToCompany(companyId, {
            type: 'expense_updated',
            companyId,
            data: expense,
            timestamp: new Date(),
        });
    }
    /**
     * Obtenir le nombre de clients connectés
     */
    getConnectedClientsCount() {
        let count = 0;
        for (const clients of this.clients.values()) {
            count += clients.size;
        }
        return count;
    }
}
exports.default = new RealtimeService();
//# sourceMappingURL=realtime.service.js.map