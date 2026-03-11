import prisma from '../config/database';
import logger from '../utils/logger';
import { InvoiceStatus } from './invoiceValidation.service';

/**
 * Service pour gérer l'historique des changements de factures
 * Pour l'instant, on utilise les logs structurés
 * Plus tard, on pourra ajouter une table InvoiceHistory dans Prisma
 */
export class InvoiceHistoryService {
  /**
   * Enregistrer un changement de statut
   */
  static async logStatusChange(
    companyId: string,
    invoiceId: string,
    oldStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
    userId?: string,
    reason?: string
  ): Promise<void> {
    try {
      logger.info('Invoice status changed', {
        companyId,
        invoiceId,
        oldStatus,
        newStatus,
        userId,
        reason,
        timestamp: new Date().toISOString(),
      });

      await prisma.invoiceHistory.create({
        data: {
          companyId,
          invoiceId,
          field: 'status',
          oldValue: oldStatus,
          newValue: newStatus,
          changedBy: userId,
          reason,
        },
      });
    } catch (error: any) {
      // Ne pas bloquer le processus si l'historique échoue
      logger.error('Error logging invoice status change', {
        invoiceId,
        error: error.message,
      });
    }
  }

  /**
   * Enregistrer une modification de facture
   */
  static async logModification(
    companyId: string,
    invoiceId: string,
    field: string,
    oldValue: any,
    newValue: any,
    userId?: string
  ): Promise<void> {
    try {
      logger.info('Invoice modified', {
        companyId,
        invoiceId,
        field,
        oldValue,
        newValue,
        userId,
        timestamp: new Date().toISOString(),
      });

      await prisma.invoiceHistory.create({
        data: {
          companyId,
          invoiceId,
          field,
          oldValue,
          newValue,
          changedBy: userId,
        },
      });
    } catch (error: any) {
      logger.error('Error logging invoice modification', {
        invoiceId,
        error: error.message,
      });
    }
  }

  /**
   * Récupérer l'historique d'une facture (pour l'instant, via les logs)
   * Plus tard, on pourra interroger la table InvoiceHistory
   */
  static async getHistory(
    companyId: string,
    invoiceId: string
  ): Promise<Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changedBy?: string;
    timestamp: string;
  }>> {
    const records = await prisma.invoiceHistory.findMany({
      where: {
        companyId,
        invoiceId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return records.map((r) => ({
      field: r.field,
      oldValue: r.oldValue,
      newValue: r.newValue,
      changedBy: r.changedBy || undefined,
      timestamp: r.createdAt.toISOString(),
    }));
  }
}

export default InvoiceHistoryService;

