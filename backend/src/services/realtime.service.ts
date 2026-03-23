/**
 * Service pour les mises à jour en temps réel
 * Utilise Server-Sent Events (SSE) pour notifier les clients
 */

import { EventEmitter } from 'events';
import logger from '../utils/logger';

export interface RealtimeEvent {
  type: 'dashboard_stats' | 'invoice_created' | 'invoice_updated' | 'invoice_status_changed' | 'payment_created' | 'expense_created' | 'expense_updated';
  companyId: string;
  data: any;
  timestamp: Date;
}

class RealtimeService extends EventEmitter {
  private clients: Map<string, Set<{ companyId: string; res: any }>> = new Map();

  /**
   * Enregistrer un client SSE
   */
  registerClient(sessionId: string, companyId: string, res: any) {
    if (!this.clients.has(sessionId)) {
      this.clients.set(sessionId, new Set());
    }

    const client = { companyId, res };
    this.clients.get(sessionId)!.add(client);

    // Envoyer un message de connexion
    this.sendToClient(sessionId, client, {
      type: 'connected',
      message: 'Connected to real-time updates',
      timestamp: new Date(),
    });

    logger.info('Client registered for real-time updates', {
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
  unregisterClient(sessionId: string, client: { companyId: string; res: any }) {
    const clients = this.clients.get(sessionId);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) {
        this.clients.delete(sessionId);
      }
    }

    logger.info('Client unregistered from real-time updates', {
      sessionId,
      companyId: client.companyId,
      totalClients: this.clients.size,
    });
  }

  /**
   * Envoyer un événement à un client spécifique
   */
  private sendToClient(
    sessionId: string,
    client: { companyId: string; res: any },
    event: any
  ) {
    try {
      if (!client.res.writable || client.res.destroyed) {
        this.unregisterClient(sessionId, client);
        return;
      }

      client.res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (error: any) {
      logger.error('Error sending SSE event to client', {
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
  emitToCompany(companyId: string, event: RealtimeEvent) {
    let sentCount = 0;

    for (const [sessionId, clients] of this.clients.entries()) {
      for (const client of clients) {
        if (client.companyId === companyId) {
          this.sendToClient(sessionId, client, event);
          sentCount++;
        }
      }
    }

    logger.debug('Event emitted to company', {
      companyId,
      eventType: event.type,
      sentCount,
    });
  }

  /**
   * Émettre un événement de mise à jour des stats du dashboard
   */
  emitDashboardStatsUpdate(companyId: string, stats: any) {
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
  emitInvoiceCreated(companyId: string, invoice: any) {
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
  emitInvoiceUpdated(companyId: string, invoice: any) {
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
  emitInvoiceStatusChanged(companyId: string, invoiceId: string, oldStatus: string, newStatus: string) {
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
  emitPaymentCreated(companyId: string, payment: any) {
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
  emitExpenseCreated(companyId: string, expense: any) {
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
  emitExpenseUpdated(companyId: string, expense: any) {
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
  getConnectedClientsCount(): number {
    let count = 0;
    for (const clients of this.clients.values()) {
      count += clients.size;
    }
    return count;
  }
}

export default new RealtimeService();

